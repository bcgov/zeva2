"use server";

import { Directory } from "@/app/lib/constants/minio";
import { getPresignedGetObjectUrl, putObject } from "@/app/lib/minio";
import { AssessmentTemplate, ForecastTemplate, MyrTemplate } from "./constants";
import { getUserInfo } from "@/auth";
import {
  ModelYear,
  ModelYearReportStatus,
  ModelYearReportSupplierStatus,
  Notification,
  Prisma,
  ReassessmentStatus,
  ReferenceType,
  Role,
  SupplierClass,
  VehicleClass,
  ZevClass,
} from "@/prisma/generated/client";
import {
  createHistory,
  createReassessmentHistory,
  getAssessmentSystemData,
  getLegacyAssessedMyr,
  getMyrDataForAssessment,
  getMyrDataForLegacyReassessment,
  getMyrDataFromSubmission,
  getOrgDetails,
  getReassessableMyrData,
  getVehicleStatistics,
  getZevUnitData,
  MyrZevUnitTransaction,
  OrgNameAndAddresses,
  revertFields,
  updateMyrReassessmentStatus,
  VehicleStatistics,
} from "./services";
import {
  DataOrErrorActionResponse,
  ErrorOrSuccessActionResponse,
  getDataActionResponse,
  getErrorActionResponse,
  getSuccessActionResponse,
} from "@/app/lib/utils/actionResponse";
import { ZevUnitRecord } from "@/lib/utils/zevUnit";
import {
  ComplianceInfo,
  ComplianceReduction,
  getComplianceInfo,
  getReportFullObjectName,
  getSerializedMyrRecords,
  getSerializedMyrRecordsExcludeKey,
  UnitsAsString,
} from "./utilsServer";
import { prisma } from "@/lib/prisma";
import {
  getAdjacentYear,
  getComplianceDate,
  getCompliancePeriod,
  getModelYearReportModelYear,
} from "@/app/lib/utils/complianceYear";
import { addJobToEmailQueue } from "@/app/lib/services/queue";
import { Buffer } from "node:buffer";
import { getModelYearEnumsToStringsMap } from "@/app/lib/utils/enumMaps";

export type NvValues = Partial<Record<VehicleClass, string>>;

export type SupplierData = OrgNameAndAddresses & {
  supplierClass: SupplierClass;
};

export type MyrEndingBalance = UnitsAsString<ZevUnitRecord>[];

export type MyrComplianceReductions = Omit<
  UnitsAsString<ComplianceReduction>,
  "type"
>[];

export type MyrOffsets = Omit<UnitsAsString<ZevUnitRecord>, "type">[];

export type MyrCurrentTransactions = UnitsAsString<MyrZevUnitTransaction>[];

export type MyrData = {
  modelYear: ModelYear;
  zevClassOrdering: ZevClass[];
  supplierData: SupplierData;
  vehicleStatistics: VehicleStatistics;
  prevEndingBalance: MyrEndingBalance;
  complianceReductions: MyrComplianceReductions;
  offsets: MyrOffsets;
  currentTransactions: MyrCurrentTransactions;
  prelimEndingBalance: MyrEndingBalance;
};

export const getMyrTemplateUrl = async () => {
  return await getPresignedGetObjectUrl(
    `${Directory.Templates}/${MyrTemplate.Name}`,
  );
};

export const getMyrData = async (
  modelYear: ModelYear,
  nvValues: NvValues,
  zevClassOrdering: ZevClass[],
): Promise<DataOrErrorActionResponse<MyrData>> => {
  const { userOrgId } = await getUserInfo();
  const orgData = await getOrgDetails(userOrgId);
  const vehicleStatistics = await getVehicleStatistics(userOrgId, modelYear);
  try {
    const {
      supplierClass,
      prevEndingBalance,
      complianceReductions,
      offsettedCredits,
      currentTransactions,
      endingBalance,
    } = await getZevUnitData(
      userOrgId,
      modelYear,
      nvValues,
      zevClassOrdering,
      [],
      false,
    );
    return getDataActionResponse<MyrData>({
      modelYear,
      zevClassOrdering,
      supplierData: { ...orgData, supplierClass },
      vehicleStatistics,
      prevEndingBalance:
        getSerializedMyrRecords<ZevUnitRecord>(prevEndingBalance),
      complianceReductions: getSerializedMyrRecordsExcludeKey<
        ComplianceReduction,
        "type"
      >(complianceReductions, "type"),
      offsets: getSerializedMyrRecordsExcludeKey<ZevUnitRecord, "type">(
        offsettedCredits,
        "type",
      ),
      currentTransactions:
        getSerializedMyrRecords<MyrZevUnitTransaction>(currentTransactions),
      prelimEndingBalance:
        getSerializedMyrRecords<ZevUnitRecord>(endingBalance),
    });
  } catch (e) {
    if (e instanceof Error) {
      return getErrorActionResponse(e.message);
    }
    throw e;
  }
};

export const getForecastTemplateUrl = async () => {
  return await getPresignedGetObjectUrl(
    `${Directory.Templates}/${ForecastTemplate.Name}`,
  );
};

export const submitReports = async (
  modelYear: ModelYear,
  modelYearReport: string,
  forecast: string,
  comment?: string,
): Promise<DataOrErrorActionResponse<number>> => {
  let idOfReport = NaN;
  const { userIsGov, userOrgId, userId } = await getUserInfo();
  if (userIsGov) {
    return getErrorActionResponse("Unauthorized!");
  }
  const existingMyr = await prisma.modelYearReport.findUnique({
    where: {
      organizationId_modelYear: {
        organizationId: userOrgId,
        modelYear: modelYear,
      },
    },
  });
  const reportYear = getModelYearReportModelYear();
  if (
    (existingMyr &&
      existingMyr.status !== ModelYearReportStatus.RETURNED_TO_SUPPLIER) ||
    (!existingMyr && modelYear !== reportYear)
  ) {
    return getErrorActionResponse("Invalid Action!");
  }
  const existingLegacyAssessedReport =
    await prisma.legacyAssessedModelYearReport.findUnique({
      where: {
        organizationId_modelYear: {
          organizationId: userOrgId,
          modelYear: modelYear,
        },
      },
    });
  if (existingLegacyAssessedReport) {
    return getErrorActionResponse("Invalid Action!");
  }
  const myrObject = Buffer.from(modelYearReport, "base64");
  const myrObjectName = getReportFullObjectName("myr");
  const forecastObject = Buffer.from(forecast, "base64");
  const forecastObjectName = getReportFullObjectName("forecast");
  const upsertData = {
    status: ModelYearReportStatus.SUBMITTED_TO_GOVERNMENT,
    supplierStatus: ModelYearReportSupplierStatus.SUBMITTED_TO_GOVERNMENT,
    objectName: myrObjectName,
    forecastReportObjectName: forecastObjectName,
  };
  const data = await getMyrDataFromSubmission(myrObject.buffer);
  const supplierClass = data.supplierClass;
  const reportableNvValue = data.reportableNvValue;
  await prisma.$transaction(async (tx) => {
    if (existingMyr) {
      await tx.modelYearReport.update({
        where: {
          id: existingMyr.id,
        },
        data: {
          ...upsertData,
          status: ModelYearReportStatus.SUBMITTED_TO_GOVERNMENT,
          supplierStatus: ModelYearReportSupplierStatus.SUBMITTED_TO_GOVERNMENT,
          supplierClass,
          supplierSupplierClass: supplierClass,
          reportableNvValue,
          supplierReportableNvValue: reportableNvValue,
        },
      });
      idOfReport = existingMyr.id;
    } else {
      const { id: newId } = await tx.modelYearReport.create({
        data: {
          ...upsertData,
          organizationId: userOrgId,
          modelYear,
          supplierClass,
          supplierSupplierClass: supplierClass,
          reportableNvValue,
          supplierReportableNvValue: reportableNvValue,
        },
      });
      idOfReport = newId;
    }
    const historyId = await createHistory(
      idOfReport,
      userId,
      ModelYearReportStatus.SUBMITTED_TO_GOVERNMENT,
      comment,
      tx,
    );
    await putObject(myrObjectName, myrObject);
    await putObject(forecastObjectName, forecastObject);
    await addJobToEmailQueue({
      historyId,
      notificationType: Notification.MODEL_YEAR_REPORT,
    });
  });
  return getDataActionResponse<number>(idOfReport);
};

export const getAssessmentTemplateUrl = async () => {
  return await getPresignedGetObjectUrl(
    `${Directory.Templates}/${AssessmentTemplate.Name}`,
  );
};

export type AdjustmentPayload = Omit<ZevUnitRecord, "numberOfUnits"> & {
  numberOfUnits: string;
};

export type AssessmentData = {
  orgName: string;
  modelYear: ModelYear;
  zevClassOrdering: ZevClass[];
  supplierClass: SupplierClass;
  complianceReductions: MyrComplianceReductions;
  beginningBalance: MyrEndingBalance;
  currentTransactions: MyrCurrentTransactions;
  offsets: MyrOffsets;
  endingBalance: MyrEndingBalance;
  complianceInfo: ComplianceInfo;
};

export type AssessmentArgs = {
  assessmentType: "assessment";
  myrId: number;
  adjustments: AdjustmentPayload[];
};

export type LegacyReassessmentArgs = {
  assessmentType: "legacyReassessment";
  orgId: number;
  modelYear: ModelYear;
  adjustments: AdjustmentPayload[];
  nvValues: NvValues;
};

export type NonLegacyReassessmentArgs = {
  assessmentType: "nonLegacyReassessment";
  myrId: number;
  adjustments: AdjustmentPayload[];
  nvValues: NvValues;
};

export const getAssessmentData = async (
  args: AssessmentArgs | LegacyReassessmentArgs | NonLegacyReassessmentArgs,
): Promise<DataOrErrorActionResponse<AssessmentData>> => {
  const { userIsGov } = await getUserInfo();
  if (!userIsGov) {
    return getErrorActionResponse("Unauthorized!");
  }
  try {
    const {
      orgName,
      organizationId,
      modelYear,
      nvValues: myrNvValues,
      zevClassOrdering,
    } = args.assessmentType === "assessment" ||
    args.assessmentType === "nonLegacyReassessment"
      ? await getMyrDataForAssessment(args.myrId)
      : await getMyrDataForLegacyReassessment(args.orgId, args.modelYear);
    const nvValuesToUse =
      args.assessmentType === "assessment" ? myrNvValues : args.nvValues;
    const {
      supplierClass,
      prevEndingBalance,
      complianceReductions,
      endingBalance,
      offsettedCredits,
      currentTransactions,
    } = await getZevUnitData(
      organizationId,
      modelYear,
      nvValuesToUse,
      zevClassOrdering,
      args.adjustments,
      args.assessmentType !== "assessment",
    );
    const complianceInfo = getComplianceInfo(
      supplierClass,
      modelYear,
      prevEndingBalance,
      endingBalance,
    );
    return getDataActionResponse<AssessmentData>({
      orgName,
      modelYear,
      zevClassOrdering,
      supplierClass,
      complianceInfo,
      beginningBalance:
        getSerializedMyrRecords<ZevUnitRecord>(prevEndingBalance),
      complianceReductions: getSerializedMyrRecordsExcludeKey<
        ComplianceReduction,
        "type"
      >(complianceReductions, "type"),
      endingBalance: getSerializedMyrRecords<ZevUnitRecord>(endingBalance),
      offsets: getSerializedMyrRecordsExcludeKey<ZevUnitRecord, "type">(
        offsettedCredits,
        "type",
      ),
      currentTransactions:
        getSerializedMyrRecords<MyrZevUnitTransaction>(currentTransactions),
    });
  } catch (e) {
    if (e instanceof Error) {
      return getErrorActionResponse(e.message);
    }
    throw e;
  }
};

export const submitAssessment = async (
  myrId: number,
  assessment: string,
  comment?: string,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userIsGov, userId, userRoles } = await getUserInfo();
  if (!userIsGov || !userRoles.includes(Role.ZEVA_IDIR_USER)) {
    return getErrorActionResponse("Unauthorized!");
  }
  const myr = await prisma.modelYearReport.findUnique({
    where: {
      id: myrId,
      status: {
        in: [
          ModelYearReportStatus.SUBMITTED_TO_GOVERNMENT,
          ModelYearReportStatus.RETURNED_TO_ANALYST,
        ],
      },
    },
  });
  if (!myr) {
    return getErrorActionResponse("Invalid Action!");
  }
  const modelYearsMap = getModelYearEnumsToStringsMap();
  const year = modelYearsMap[getAdjacentYear("next", myr.modelYear)];
  if (!year) {
    return getErrorActionResponse("Unexpected Error!");
  }
  if (new Date() < new Date(`${year}-${10}-${21}T00:00:00`)) {
    return getErrorActionResponse("Invalid Action!");
  }
  const assessmentObject = Buffer.from(assessment, "base64");
  const assessmentObjectName = getReportFullObjectName("assessment");
  const data = await getAssessmentSystemData(assessmentObject.buffer);
  await prisma.$transaction(async (tx) => {
    await tx.modelYearReport.update({
      where: {
        id: myrId,
      },
      data: {
        status: ModelYearReportStatus.SUBMITTED_TO_DIRECTOR,
        compliant: data.compliant,
        supplierClass: data.supplierClass,
        reportableNvValue: data.reportableNvValue,
      },
    });
    await tx.assessment.create({
      data: {
        modelYearReportId: myrId,
        objectName: assessmentObjectName,
      },
    });
    const historyId = await createHistory(
      myrId,
      userId,
      ModelYearReportStatus.SUBMITTED_TO_DIRECTOR,
      comment,
      tx,
    );
    await putObject(assessmentObjectName, assessmentObject);
    await addJobToEmailQueue({
      historyId,
      notificationType: Notification.MODEL_YEAR_REPORT,
    });
  });
  return getSuccessActionResponse();
};

export const submitReassessment = async (
  organizationId: number,
  modelYear: ModelYear,
  reassessment: string,
  comment?: string,
): Promise<DataOrErrorActionResponse<number>> => {
  const { userIsGov, userId, userRoles } = await getUserInfo();
  if (!userIsGov || !userRoles.includes(Role.ZEVA_IDIR_USER)) {
    return getErrorActionResponse("Unauthorized!");
  }
  const { myrId, legacyMyrId } = await getReassessableMyrData(
    organizationId,
    modelYear,
  );
  if (!myrId && !legacyMyrId) {
    return getErrorActionResponse("A reassessable MYR does not exist!");
  }
  const latestReassessment = await prisma.reassessment.findFirst({
    where: {
      organizationId,
      modelYear: modelYear,
    },
    orderBy: {
      sequenceNumber: "desc",
    },
  });
  if (
    latestReassessment &&
    latestReassessment.status === ReassessmentStatus.SUBMITTED_TO_DIRECTOR
  ) {
    return getErrorActionResponse("Invalid Action!");
  }
  const reassessmentObject = Buffer.from(reassessment, "base64");
  const reassessmentObjectName = getReportFullObjectName("reassessment");
  const data = await getAssessmentSystemData(reassessmentObject.buffer);
  let reassessmentIdToReturn: number = latestReassessment
    ? latestReassessment.id
    : Number.NaN;
  await prisma.$transaction(async (tx) => {
    if (
      latestReassessment &&
      latestReassessment.status === ReassessmentStatus.RETURNED_TO_ANALYST
    ) {
      // resubmission:
      await tx.reassessment.update({
        where: {
          id: latestReassessment.id,
        },
        data: {
          status: ReassessmentStatus.SUBMITTED_TO_DIRECTOR,
          objectName: reassessmentObjectName,
        },
      });
      await createReassessmentHistory(
        latestReassessment.id,
        userId,
        ReassessmentStatus.SUBMITTED_TO_DIRECTOR,
        comment,
        tx,
      );
    } else if (
      !latestReassessment ||
      latestReassessment.status === ReassessmentStatus.ISSUED
    ) {
      // new submission:
      let sequenceNumber = 0;
      if (latestReassessment) {
        sequenceNumber = latestReassessment.sequenceNumber + 1;
      }
      const { id: reassessmentId } = await tx.reassessment.create({
        data: {
          organizationId: organizationId,
          modelYear: modelYear,
          status: ReassessmentStatus.SUBMITTED_TO_DIRECTOR,
          sequenceNumber,
          objectName: reassessmentObjectName,
          modelYearReportId: myrId,
        },
      });
      reassessmentIdToReturn = reassessmentId;
      await createReassessmentHistory(
        reassessmentId,
        userId,
        ReassessmentStatus.SUBMITTED_TO_DIRECTOR,
        comment,
        tx,
      );
    }
    if (myrId) {
      await updateMyrReassessmentStatus(
        myrId,
        ReassessmentStatus.SUBMITTED_TO_DIRECTOR,
        tx,
      );
      await tx.modelYearReport.update({
        where: {
          id: myrId,
        },
        data: {
          supplierClass: data.supplierClass,
          compliant: data.compliant,
          reportableNvValue: data.reportableNvValue,
        },
      });
    }
    await putObject(reassessmentObjectName, reassessmentObject);
  });
  return getDataActionResponse(reassessmentIdToReturn);
};

export const returnModelYearReport = async (
  myrId: number,
  returnType: ModelYearReportStatus,
  comment?: string,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userIsGov, userId, userRoles } = await getUserInfo();
  if (!userIsGov) {
    return getErrorActionResponse("Unauthorized!");
  }
  const myr = await prisma.modelYearReport.findUnique({
    where: { id: myrId },
    select: {
      status: true,
      supplierSupplierClass: true,
      supplierCompliant: true,
      supplierReportableNvValue: true,
    },
  });
  if (!myr) {
    return getErrorActionResponse("Model Year Report not found!");
  }
  const status = myr.status;
  if (
    (status === ModelYearReportStatus.SUBMITTED_TO_DIRECTOR &&
      returnType === ModelYearReportStatus.RETURNED_TO_ANALYST &&
      userRoles.includes(Role.DIRECTOR)) ||
    (status === ModelYearReportStatus.SUBMITTED_TO_GOVERNMENT &&
      returnType === ModelYearReportStatus.RETURNED_TO_SUPPLIER &&
      userRoles.includes(Role.ZEVA_IDIR_USER))
  ) {
    await prisma.$transaction(async (tx) => {
      const updateData: Prisma.ModelYearReportUpdateInput = {
        status: returnType,
      };
      if (returnType === ModelYearReportStatus.RETURNED_TO_SUPPLIER) {
        updateData.supplierStatus = returnType;
      }
      await tx.modelYearReport.update({
        where: {
          id: myrId,
        },
        data: updateData,
      });
      const historyId = await createHistory(
        myrId,
        userId,
        returnType,
        comment,
        tx,
      );
      if (returnType === ModelYearReportStatus.RETURNED_TO_SUPPLIER) {
        await revertFields(
          myrId,
          myr.supplierSupplierClass,
          myr.supplierReportableNvValue,
          myr.supplierCompliant,
          tx,
        );
        await tx.assessment.delete({
          where: {
            modelYearReportId: myrId,
          },
        });
      }
      await addJobToEmailQueue({
        historyId,
        notificationType: Notification.MODEL_YEAR_REPORT,
      });
    });
    return getSuccessActionResponse();
  }
  return getErrorActionResponse("Invalid Action!");
};

export const assessModelYearReport = async (
  myrId: number,
  comment?: string,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userIsGov, userId, userRoles } = await getUserInfo();
  if (!userIsGov || !userRoles.includes(Role.DIRECTOR)) {
    return getErrorActionResponse("Unauthorized!");
  }
  const myr = await prisma.modelYearReport.findUnique({
    where: {
      id: myrId,
      status: ModelYearReportStatus.SUBMITTED_TO_DIRECTOR,
    },
    include: {
      assessment: true,
    },
  });
  if (!myr || !myr.assessment) {
    return getErrorActionResponse("Assessable Model Year Report not found!");
  }
  const modelYear = myr.modelYear;
  const organizationId = myr.organizationId;
  try {
    const complianceDate = getComplianceDate(modelYear);
    const assessmentData = await getAssessmentSystemData(
      myr.assessment.objectName,
    );
    const nvData: Prisma.SupplyVolumeCreateManyInput[] = [];
    assessmentData.nvValues.forEach(([vehicleClass, volume]) => {
      nvData.push({
        organizationId,
        modelYear,
        vehicleClass,
        volume,
      });
    });
    await prisma.$transaction(async (tx) => {
      await tx.supplyVolume.createMany({
        data: nvData,
      });
      await tx.zevUnitTransaction.createMany({
        data: assessmentData.transactions.map((transaction) => {
          return {
            ...transaction,
            organizationId,
            referenceId: myr.id,
            timestamp: complianceDate,
          };
        }),
      });
      await tx.zevUnitEndingBalance.createMany({
        data: assessmentData.endingBalance.map((record) => {
          return { ...record, organizationId, complianceYear: modelYear };
        }),
      });
      await tx.modelYearReport.update({
        where: {
          id: myrId,
        },
        data: {
          status: ModelYearReportStatus.ASSESSED,
          supplierStatus: ModelYearReportStatus.ASSESSED,
          supplierCompliant: assessmentData.compliant,
          supplierReportableNvValue: assessmentData.reportableNvValue,
          supplierSupplierClass: assessmentData.supplierClass,
        },
      });
      const historyId = await createHistory(
        myrId,
        userId,
        ModelYearReportStatus.ASSESSED,
        comment,
        tx,
      );
      await addJobToEmailQueue({
        historyId,
        notificationType: Notification.MODEL_YEAR_REPORT,
      });
    });
  } catch (e) {
    if (e instanceof Error) {
      return getErrorActionResponse(e.message);
    }
    throw e;
  }
  return getSuccessActionResponse();
};

export const returnReassessment = async (
  reassessmentId: number,
  comment?: string,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userIsGov, userId, userRoles } = await getUserInfo();
  if (!userIsGov || !userRoles.includes(Role.DIRECTOR)) {
    return getErrorActionResponse("Unauthorized!");
  }
  const reassessment = await prisma.reassessment.findUnique({
    where: {
      id: reassessmentId,
      status: ReassessmentStatus.SUBMITTED_TO_DIRECTOR,
    },
  });
  if (!reassessment) {
    return getErrorActionResponse("Valid Reassessment not found!");
  }
  const myrId = reassessment.modelYearReportId;
  await prisma.$transaction(async (tx) => {
    await tx.reassessment.update({
      where: {
        id: reassessmentId,
      },
      data: {
        status: ReassessmentStatus.RETURNED_TO_ANALYST,
      },
    });
    await createReassessmentHistory(
      reassessment.id,
      userId,
      ReassessmentStatus.RETURNED_TO_ANALYST,
      comment,
      tx,
    );
    if (myrId) {
      await updateMyrReassessmentStatus(
        myrId,
        ReassessmentStatus.RETURNED_TO_ANALYST,
        tx,
      );
    }
  });
  return getSuccessActionResponse();
};

export const issueReassessment = async (
  reassessmentId: number,
  comment?: string,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userIsGov, userId, userRoles } = await getUserInfo();
  if (!userIsGov || !userRoles.includes(Role.DIRECTOR)) {
    return getErrorActionResponse("Unauthorized!");
  }
  const reassessment = await prisma.reassessment.findUnique({
    where: {
      id: reassessmentId,
      status: ReassessmentStatus.SUBMITTED_TO_DIRECTOR,
    },
  });
  if (!reassessment) {
    return getErrorActionResponse("Valid Reassessment not found!");
  }
  const organizationId = reassessment.organizationId;
  const modelYear = reassessment.modelYear;
  const myrId = reassessment.modelYearReportId;
  const legacyMyr = await getLegacyAssessedMyr(organizationId, modelYear);
  const complianceDate = getComplianceDate(modelYear);
  const compliancePeriod = getCompliancePeriod(modelYear);
  const reassessmentData = await getAssessmentSystemData(
    reassessment.objectName,
  );
  const volumeUpsertClauses = reassessmentData.nvValues.map(
    ([vehicleClass, volume]) => ({
      where: {
        organizationId_vehicleClass_modelYear: {
          organizationId,
          vehicleClass,
          modelYear,
        },
      },
      create: {
        organizationId,
        modelYear,
        vehicleClass,
        volume,
      },
      update: {
        volume,
      },
    }),
  );
  await prisma.$transaction(async (tx) => {
    if (modelYear < ModelYear.MY_2024) {
      for (const clause of volumeUpsertClauses) {
        await tx.legacySalesVolume.upsert(clause);
      }
    } else {
      for (const clause of volumeUpsertClauses) {
        await tx.supplyVolume.upsert(clause);
      }
    }
    await tx.zevUnitTransaction.deleteMany({
      where: {
        organizationId,
        referenceType: ReferenceType.OBLIGATION_REDUCTION,
        AND: [
          { timestamp: { gte: compliancePeriod.closedLowerBound } },
          { timestamp: { lt: compliancePeriod.openUpperBound } },
        ],
      },
    });
    await tx.zevUnitTransaction.createMany({
      data: reassessmentData.transactions.map((transaction) => {
        return {
          ...transaction,
          organizationId,
          referenceId: myrId,
          legacyReferenceId: legacyMyr ? legacyMyr.legacyId : null,
          timestamp: complianceDate,
        };
      }),
    });
    await tx.zevUnitEndingBalance.deleteMany({
      where: {
        organizationId,
        complianceYear: modelYear,
      },
    });
    await tx.zevUnitEndingBalance.createMany({
      data: reassessmentData.endingBalance.map((record) => {
        return { ...record, organizationId, complianceYear: modelYear };
      }),
    });
    await tx.reassessment.update({
      where: {
        id: reassessment.id,
      },
      data: {
        status: ReassessmentStatus.ISSUED,
      },
    });
    await createReassessmentHistory(
      reassessment.id,
      userId,
      ReassessmentStatus.ISSUED,
      comment,
      tx,
    );
    if (myrId) {
      await updateMyrReassessmentStatus(myrId, ReassessmentStatus.ISSUED, tx);
      await tx.modelYearReport.update({
        where: {
          id: myrId,
        },
        data: {
          supplierCompliant: reassessmentData.compliant,
          supplierReportableNvValue: reassessmentData.reportableNvValue,
          supplierSupplierClass: reassessmentData.supplierClass,
        },
      });
    }
  });
  return getSuccessActionResponse();
};

export const deleteReassessment = async (
  reassessmentId: number,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userIsGov, userRoles } = await getUserInfo();
  if (!userIsGov || !userRoles.includes(Role.ZEVA_IDIR_USER)) {
    return getErrorActionResponse("Unauthorized!");
  }
  const reassessment = await prisma.reassessment.findUnique({
    where: {
      id: reassessmentId,
      status: ReassessmentStatus.RETURNED_TO_ANALYST,
    },
    include: {
      modelYearReport: {
        select: {
          id: true,
          supplierReassessmentStatus: true,
          supplierCompliant: true,
          supplierReportableNvValue: true,
          supplierSupplierClass: true,
        },
      },
    },
  });
  if (!reassessment) {
    return getErrorActionResponse("Valid Reassessment not found!");
  }
  const myr = reassessment.modelYearReport;
  await prisma.$transaction(async (tx) => {
    await tx.reassessmentHistory.deleteMany({
      where: {
        reassessmentId,
      },
    });
    await tx.reassessment.delete({
      where: {
        id: reassessmentId,
      },
    });
    if (myr) {
      await updateMyrReassessmentStatus(
        myr.id,
        myr.supplierReassessmentStatus,
        tx,
      );
      await revertFields(
        myr.id,
        myr.supplierSupplierClass,
        myr.supplierReportableNvValue,
        myr.supplierCompliant,
        tx,
      );
    }
  });
  return getSuccessActionResponse();
};
