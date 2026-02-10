"use server";

import { Directory } from "@/app/lib/constants/minio";
import { getPresignedGetObjectUrl, putObject } from "@/app/lib/minio";
import { AssessmentTemplate, ForecastTemplate, MyrTemplate } from "./constants";
import { getUserInfo } from "@/auth";
import {
  ModelYear,
  ModelYearReportStatus,
  Notification,
  Prisma,
  ReassessmentStatus,
  ReferenceType,
  Role,
  SupplementaryReportStatus,
  SupplierClass,
  VehicleClass,
  ZevClass,
} from "@/prisma/generated/client";
import {
  createHistory,
  createReassessmentHistory,
  createSupplementaryHistory,
  getAssessmentSystemData,
  getDataForSupplementary,
  getLegacyAssessedMyr,
  getDataForReassessment,
  getZevUnitData,
  MyrZevUnitTransaction,
  updateMyrReassessmentStatus,
  areTransfersCovered,
  getSupplierClassAndVolumes,
  getVehicleStatistics,
  updateMyrSupplementaryStatus,
  validateReassesmentTimeLimit,
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

export type MyrEndingBalance = UnitsAsString<ZevUnitRecord>[];

export type MyrComplianceReductions = Omit<
  UnitsAsString<ComplianceReduction>,
  "type"
>[];

export type MyrOffsets = Omit<UnitsAsString<ZevUnitRecord>, "type">[];

export type MyrCurrentTransactions = UnitsAsString<MyrZevUnitTransaction>[];

export type MyrData = {
  supplierClass: SupplierClass;
  volumes: [ModelYear, VehicleClass, number][];
  prevEndingBalance: MyrEndingBalance;
  complianceReductions: MyrComplianceReductions;
  offsets: MyrOffsets;
  currentTransactions: MyrCurrentTransactions;
  pendingSupplyCredits: UnitsAsString<ZevUnitRecord>[];
  prelimEndingBalance: MyrEndingBalance;
};

export const retrieveVehicleStatistics = async (modelYear: ModelYear) => {
  const { userOrgId } = await getUserInfo();
  const vehicleStatistics = await getVehicleStatistics(userOrgId, modelYear);
  return getDataActionResponse(vehicleStatistics);
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
  adjustments: AdjustmentPayload[],
): Promise<DataOrErrorActionResponse<MyrData>> => {
  const { userOrgId } = await getUserInfo();
  const reportableNvValue = nvValues[VehicleClass.REPORTABLE];
  if (!reportableNvValue) {
    return getErrorActionResponse("Reportable NV Value not found!");
  }
  try {
    const { supplierClass, volumes } = await getSupplierClassAndVolumes(
      userOrgId,
      modelYear,
      reportableNvValue,
    );
    const {
      prevEndingBalance,
      complianceReductions,
      offsettedCredits,
      currentTransactions,
      pendingSupplyCredits,
      endingBalance,
    } = await getZevUnitData(
      userOrgId,
      modelYear,
      supplierClass,
      nvValues,
      zevClassOrdering,
      adjustments,
      true,
    );
    return getDataActionResponse<MyrData>({
      supplierClass,
      volumes,
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
      pendingSupplyCredits:
        getSerializedMyrRecords<ZevUnitRecord>(pendingSupplyCredits),
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

export const saveReports = async (
  modelYear: ModelYear,
  modelYearReport: string,
  forecastReport: string,
  forecastReportFileName: string,
): Promise<DataOrErrorActionResponse<number>> => {
  let idOfReport = NaN;
  const { userIsGov, userOrgId } = await getUserInfo();
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
    select: {
      id: true,
      status: true,
      modelYear: true,
    },
  });
  const reportYear = getModelYearReportModelYear();
  if (
    (existingMyr &&
      (existingMyr.modelYear !== modelYear ||
        (existingMyr.status !== ModelYearReportStatus.DRAFT &&
          existingMyr.status !==
            ModelYearReportStatus.RETURNED_TO_SUPPLIER))) ||
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
      select: {
        id: true,
      },
    });
  if (existingLegacyAssessedReport) {
    return getErrorActionResponse("Invalid Action!");
  }
  const myrObject = Buffer.from(modelYearReport, "base64");
  const myrObjectName = getReportFullObjectName("myr");
  const forecastObject = Buffer.from(forecastReport, "base64");
  const forecastObjectName = getReportFullObjectName("forecast");
  await prisma.$transaction(async (tx) => {
    if (existingMyr) {
      await tx.modelYearReport.update({
        where: {
          id: existingMyr.id,
        },
        data: {
          objectName: myrObjectName,
          forecastReportObjectName: forecastObjectName,
        },
      });
      idOfReport = existingMyr.id;
    } else {
      const { id: newId } = await tx.modelYearReport.create({
        data: {
          objectName: myrObjectName,
          forecastReportObjectName: forecastObjectName,
          forecastReportFileName,
          status: ModelYearReportStatus.DRAFT,
          supplierStatus: ModelYearReportStatus.DRAFT,
          organizationId: userOrgId,
          modelYear,
        },
      });
      idOfReport = newId;
    }
    await putObject(myrObjectName, myrObject);
    await putObject(forecastObjectName, forecastObject);
  });
  return getDataActionResponse<number>(idOfReport);
};

export const submitReports = async (
  myrId: number,
  comment?: string,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userIsGov, userOrgId, userId } = await getUserInfo();
  if (userIsGov) {
    return getErrorActionResponse("Unauthorized!");
  }
  const myr = await prisma.modelYearReport.findUnique({
    where: {
      id: myrId,
      organizationId: userOrgId,
      status: {
        in: [
          ModelYearReportStatus.DRAFT,
          ModelYearReportStatus.RETURNED_TO_SUPPLIER,
        ],
      },
    },
    select: {
      id: true,
    },
  });
  if (!myr) {
    return getErrorActionResponse("Invalid Action!");
  }
  await prisma.$transaction(async (tx) => {
    await tx.modelYearReport.update({
      where: {
        id: myrId,
      },
      data: {
        status: ModelYearReportStatus.SUBMITTED_TO_GOVERNMENT,
        supplierStatus: ModelYearReportStatus.SUBMITTED_TO_GOVERNMENT,
      },
    });
    const historyId = await createHistory(
      myrId,
      userId,
      ModelYearReportStatus.SUBMITTED_TO_GOVERNMENT,
      comment,
      tx,
    );
    await addJobToEmailQueue({
      historyId,
      notificationType: Notification.MODEL_YEAR_REPORT,
    });
  });
  return getSuccessActionResponse();
};

export const deleteReports = async (
  myrId: number,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userIsGov, userOrgId } = await getUserInfo();
  if (userIsGov) {
    return getErrorActionResponse("Unauthorized!");
  }
  const myr = await prisma.modelYearReport.findUnique({
    where: {
      id: myrId,
      organizationId: userOrgId,
      status: {
        in: [
          ModelYearReportStatus.DRAFT,
          ModelYearReportStatus.RETURNED_TO_SUPPLIER,
        ],
      },
    },
    select: {
      id: true,
    },
  });
  if (!myr) {
    return getErrorActionResponse("Invalid Action!");
  }
  await prisma.$transaction(async (tx) => {
    await tx.supplementaryReportHistory.deleteMany({
      where: {
        supplementaryReport: {
          modelYearReportId: myrId,
        },
      },
    });
    await tx.supplementaryReport.deleteMany({
      where: {
        modelYearReportId: myrId,
      },
    });
    await tx.modelYearReportHistory.deleteMany({
      where: {
        modelYearReportId: myrId,
      },
    });
    await tx.modelYearReport.delete({
      where: {
        id: myrId,
      },
    });
  });
  return getSuccessActionResponse();
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
  supplierClass: SupplierClass;
  complianceReductions: MyrComplianceReductions;
  beginningBalance: MyrEndingBalance;
  currentTransactions: MyrCurrentTransactions;
  offsets: MyrOffsets;
  endingBalance: MyrEndingBalance;
  complianceInfo: ComplianceInfo;
};

export const getAssessmentData = async (
  orgId: number,
  modelYear: ModelYear,
  adjustments: AdjustmentPayload[],
  nvValues: NvValues,
  zevClassOrdering: ZevClass[],
): Promise<DataOrErrorActionResponse<AssessmentData>> => {
  const { userIsGov } = await getUserInfo();
  if (!userIsGov) {
    return getErrorActionResponse("Unauthorized!");
  }
  const reportableNvValue = nvValues[VehicleClass.REPORTABLE];
  if (!reportableNvValue) {
    return getErrorActionResponse("Reportable NV Value not found!");
  }
  try {
    const { supplierClass } = await getSupplierClassAndVolumes(
      orgId,
      modelYear,
      reportableNvValue,
    );
    const {
      prevEndingBalance,
      complianceReductions,
      endingBalance,
      offsettedCredits,
      currentTransactions,
    } = await getZevUnitData(
      orgId,
      modelYear,
      supplierClass,
      nvValues,
      zevClassOrdering,
      adjustments,
      false,
    );
    const complianceInfo = getComplianceInfo(
      supplierClass,
      modelYear,
      prevEndingBalance,
      endingBalance,
    );
    return getDataActionResponse<AssessmentData>({
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

export const createOrSaveAssessment = async (
  myrId: number,
  assessment: string,
): Promise<DataOrErrorActionResponse<number>> => {
  const { userIsGov, userRoles } = await getUserInfo();
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
  const assessmentObject = Buffer.from(assessment, "base64");
  const assessmentObjectName = getReportFullObjectName("assessment");
  await prisma.$transaction(async (tx) => {
    await tx.assessment.upsert({
      where: {
        modelYearReportId: myrId,
      },
      create: {
        modelYearReportId: myrId,
        objectName: assessmentObjectName,
      },
      update: {
        objectName: assessmentObjectName,
      },
    });
    await putObject(assessmentObjectName, assessmentObject);
  });
  return getDataActionResponse(myrId);
};

export const submitAssessment = async (
  myrId: number,
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
      assessment: {
        isNot: null,
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
  await prisma.$transaction(async (tx) => {
    await tx.modelYearReport.update({
      where: {
        id: myrId,
      },
      data: {
        status: ModelYearReportStatus.SUBMITTED_TO_DIRECTOR,
      },
    });
    const historyId = await createHistory(
      myrId,
      userId,
      ModelYearReportStatus.SUBMITTED_TO_DIRECTOR,
      comment,
      tx,
    );
    await addJobToEmailQueue({
      historyId,
      notificationType: Notification.MODEL_YEAR_REPORT,
    });
  });
  return getSuccessActionResponse();
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
      assessment: {
        select: {
          id: true,
        },
      },
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
    ((status === ModelYearReportStatus.SUBMITTED_TO_GOVERNMENT ||
      status === ModelYearReportStatus.RETURNED_TO_ANALYST) &&
      returnType === ModelYearReportStatus.RETURNED_TO_SUPPLIER &&
      userRoles.includes(Role.ZEVA_IDIR_USER))
  ) {
    await prisma.$transaction(async (tx) => {
      const updateData: Prisma.ModelYearReportUpdateInput = {
        status: returnType,
      };
      if (returnType === ModelYearReportStatus.RETURNED_TO_SUPPLIER) {
        updateData.supplierStatus = returnType;
        updateData.supplementaryReportStatus = null;
        await tx.supplementaryReportHistory.deleteMany({
          where: {
            supplementaryReport: {
              modelYearReportId: myrId,
            },
          },
        });
        await tx.supplementaryReport.deleteMany({
          where: {
            modelYearReportId: myrId,
          },
        });
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
      if (
        returnType === ModelYearReportStatus.RETURNED_TO_SUPPLIER &&
        myr.assessment
      ) {
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
    const endingBalance = assessmentData.endingBalance.map((record) => {
      return { ...record, numberOfUnits: record.finalNumberOfUnits };
    });
    const transfersAreCovered = await areTransfersCovered(
      organizationId,
      modelYear,
      endingBalance,
    );
    if (!transfersAreCovered) {
      throw new Error(
        "Issuing this assessment would cause a transfer to become uncovered!",
      );
    }
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
          compliant: assessmentData.compliant,
          reportableNvValue: assessmentData.reportableNvValue,
          supplierClass: assessmentData.supplierClass,
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

export const createReassessment = async (
  organizationId: number,
  modelYear: ModelYear,
  reassessment: string,
): Promise<
  DataOrErrorActionResponse<{ reassessmentId: number; myrId: number | null }>
> => {
  let reassessmentId = NaN;
  const { userIsGov, userRoles } = await getUserInfo();
  if (!userIsGov || !userRoles.includes(Role.ZEVA_IDIR_USER)) {
    return getErrorActionResponse("Unauthorized!");
  }
  let sequenceNumber;
  let myrId;
  try {
    ({ sequenceNumber, myrId } = await getDataForReassessment(
      organizationId,
      modelYear,
    ));
  } catch (e) {
    return getErrorActionResponse("Invalid Action!");
  }
  const reassessmentObject = Buffer.from(reassessment, "base64");
  const reassessmentObjectName = getReportFullObjectName("reassessment");
  await prisma.$transaction(async (tx) => {
    const createdReassessment = await tx.reassessment.create({
      data: {
        organizationId,
        modelYear,
        sequenceNumber,
        objectName: reassessmentObjectName,
        status: ReassessmentStatus.DRAFT,
        modelYearReportId: myrId,
      },
    });
    reassessmentId = createdReassessment.id;
    if (myrId) {
      await updateMyrReassessmentStatus(myrId, ReassessmentStatus.DRAFT, tx);
    }
    await putObject(reassessmentObjectName, reassessmentObject);
  });
  return getDataActionResponse({
    reassessmentId,
    myrId,
  });
};

export const saveReassessment = async (
  reassessmentId: number,
  reassessmentToSave: string,
): Promise<
  DataOrErrorActionResponse<{ reassessmentId: number; myrId: number | null }>
> => {
  const { userIsGov, userRoles } = await getUserInfo();
  if (!userIsGov || !userRoles.includes(Role.ZEVA_IDIR_USER)) {
    return getErrorActionResponse("Unauthorized!");
  }
  const reassessment = await prisma.reassessment.findUnique({
    where: {
      id: reassessmentId,
      status: {
        in: [ReassessmentStatus.DRAFT, ReassessmentStatus.RETURNED_TO_ANALYST],
      },
    },
    select: {
      id: true,
      modelYearReportId: true,
    },
  });
  if (!reassessment) {
    return getErrorActionResponse("Invalid Action!");
  }
  const reassessmentObject = Buffer.from(reassessmentToSave, "base64");
  const reassessmentObjectName = getReportFullObjectName("reassessment");
  await prisma.$transaction(async (tx) => {
    await tx.reassessment.update({
      where: {
        id: reassessmentId,
      },
      data: {
        objectName: reassessmentObjectName,
      },
    });
    await putObject(reassessmentObjectName, reassessmentObject);
  });
  return getDataActionResponse({
    reassessmentId,
    myrId: reassessment.modelYearReportId,
  });
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
      status: {
        in: [ReassessmentStatus.DRAFT, ReassessmentStatus.RETURNED_TO_ANALYST],
      },
    },
    select: {
      modelYearReportId: true,
    },
  });
  if (!reassessment) {
    return getErrorActionResponse("Valid Reassessment not found!");
  }
  const myrId = reassessment.modelYearReportId;
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
    if (myrId) {
      await updateMyrReassessmentStatus(myrId, null, tx);
    }
  });
  return getSuccessActionResponse();
};

export const submitReassessment = async (
  reassessmentId: number,
  comment?: string,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userIsGov, userId, userRoles } = await getUserInfo();
  if (!userIsGov || !userRoles.includes(Role.ZEVA_IDIR_USER)) {
    return getErrorActionResponse("Unauthorized!");
  }
  const reassessment = await prisma.reassessment.findUnique({
    where: {
      id: reassessmentId,
      status: {
        in: [ReassessmentStatus.DRAFT, ReassessmentStatus.RETURNED_TO_ANALYST],
      },
    },
    select: {
      id: true,
      organizationId: true,
      modelYear: true,
      modelYearReportId: true,
    },
  });
  if (!reassessment) {
    return getErrorActionResponse("Invalid Action!");
  }
  try {
    await validateReassesmentTimeLimit(
      reassessment.organizationId,
      reassessment.modelYear,
    );
  } catch {
    return getErrorActionResponse("Invalid Action!");
  }
  const myrId = reassessment.modelYearReportId;
  await prisma.$transaction(async (tx) => {
    await tx.reassessment.update({
      where: {
        id: reassessmentId,
      },
      data: {
        status: ReassessmentStatus.SUBMITTED_TO_DIRECTOR,
      },
    });
    await createReassessmentHistory(
      reassessmentId,
      userId,
      ReassessmentStatus.SUBMITTED_TO_DIRECTOR,
      comment,
      tx,
    );
    if (myrId) {
      await updateMyrReassessmentStatus(
        myrId,
        ReassessmentStatus.SUBMITTED_TO_DIRECTOR,
        tx,
      );
    }
  });
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
    select: {
      modelYearReportId: true,
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
      reassessmentId,
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
    return getErrorActionResponse("Invalid Action");
  }
  const organizationId = reassessment.organizationId;
  const modelYear = reassessment.modelYear;
  try {
    await validateReassesmentTimeLimit(organizationId, modelYear);
  } catch {
    return getErrorActionResponse("Invalid Action");
  }
  const myrId = reassessment.modelYearReportId;
  const legacyMyr = await getLegacyAssessedMyr(organizationId, modelYear);
  const complianceDate = getComplianceDate(modelYear);
  const compliancePeriod = getCompliancePeriod(modelYear);
  const reassessmentData = await getAssessmentSystemData(
    reassessment.objectName,
  );
  const endingBalance = reassessmentData.endingBalance.map((record) => {
    return { ...record, numberOfUnits: record.finalNumberOfUnits };
  });
  const transfersAreCovered = await areTransfersCovered(
    organizationId,
    modelYear,
    endingBalance,
  );
  if (!transfersAreCovered) {
    throw new Error(
      "Issuing this reassessment would cause a transfer to become uncovered!",
    );
  }
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
        referenceType: ReferenceType.COMPLIANCE_RATIO_REDUCTION,
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
          compliant: reassessmentData.compliant,
          reportableNvValue: reassessmentData.reportableNvValue,
          supplierClass: reassessmentData.supplierClass,
        },
      });
    }
  });
  return getSuccessActionResponse();
};

export const createSupplementary = async (
  modelYear: ModelYear,
  report: string,
): Promise<
  DataOrErrorActionResponse<{ supplementaryId: number; myrId: number | null }>
> => {
  let supplementaryId = NaN;
  const { userIsGov, userOrgId } = await getUserInfo();
  if (userIsGov) {
    return getErrorActionResponse("Unauthorized!");
  }
  const reportObject = Buffer.from(report, "base64");
  const reportObjectName = getReportFullObjectName("supplementary");
  let sequenceNumber;
  let myrId;
  try {
    ({ sequenceNumber, myrId } = await getDataForSupplementary(
      userOrgId,
      modelYear,
    ));
  } catch (e) {
    return getErrorActionResponse("Invalid Action!");
  }
  await prisma.$transaction(async (tx) => {
    const createdReport = await tx.supplementaryReport.create({
      data: {
        organizationId: userOrgId,
        modelYear,
        sequenceNumber,
        objectName: reportObjectName,
        status: SupplementaryReportStatus.DRAFT,
        modelYearReportId: myrId,
      },
    });
    supplementaryId = createdReport.id;
    if (myrId) {
      await updateMyrSupplementaryStatus(
        myrId,
        SupplementaryReportStatus.DRAFT,
        tx,
      );
    }
    await putObject(reportObjectName, reportObject);
  });
  return getDataActionResponse({
    supplementaryId,
    myrId: myrId,
  });
};

export const saveSupplementary = async (
  supplementaryId: number,
  report: string,
): Promise<
  DataOrErrorActionResponse<{ supplementaryId: number; myrId: number | null }>
> => {
  const { userIsGov, userOrgId } = await getUserInfo();
  if (userIsGov) {
    return getErrorActionResponse("Unauthorized!");
  }
  const suppReport = await prisma.supplementaryReport.findUnique({
    where: {
      id: supplementaryId,
      organizationId: userOrgId,
      status: SupplementaryReportStatus.DRAFT,
    },
    select: {
      modelYearReportId: true,
    },
  });
  if (!suppReport) {
    return getErrorActionResponse("Invalid Action!");
  }
  const reportObject = Buffer.from(report, "base64");
  const reportObjectName = getReportFullObjectName("supplementary");
  await prisma.$transaction(async (tx) => {
    await tx.supplementaryReport.update({
      where: {
        id: supplementaryId,
      },
      data: {
        objectName: reportObjectName,
      },
    });
    await putObject(reportObjectName, reportObject);
  });
  return getDataActionResponse({
    supplementaryId,
    myrId: suppReport.modelYearReportId,
  });
};

export const deleteSupplementary = async (
  supplementaryId: number,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userIsGov, userOrgId } = await getUserInfo();
  if (userIsGov) {
    return getErrorActionResponse("Unauthorized!");
  }
  const suppReport = await prisma.supplementaryReport.findUnique({
    where: {
      id: supplementaryId,
      organizationId: userOrgId,
      status: SupplementaryReportStatus.DRAFT,
    },
    select: {
      id: true,
      modelYearReportId: true,
    },
  });
  if (!suppReport) {
    return getErrorActionResponse("Invalid Action!");
  }
  await prisma.$transaction(async (tx) => {
    await tx.supplementaryReport.delete({
      where: {
        id: supplementaryId,
      },
    });
    if (suppReport.modelYearReportId) {
      await updateMyrSupplementaryStatus(
        suppReport.modelYearReportId,
        null,
        tx,
      );
    }
  });

  return getSuccessActionResponse();
};

export const submitSupplementary = async (
  supplementaryId: number,
  comment?: string,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userIsGov, userOrgId, userId } = await getUserInfo();
  if (userIsGov) {
    return getErrorActionResponse("Unauthorized!");
  }
  const suppReport = await prisma.supplementaryReport.findUnique({
    where: {
      id: supplementaryId,
      organizationId: userOrgId,
      status: SupplementaryReportStatus.DRAFT,
    },
    select: {
      id: true,
      modelYearReportId: true,
    },
  });
  if (!suppReport) {
    return getErrorActionResponse("Invalid Action!");
  }
  await prisma.$transaction(async (tx) => {
    await tx.supplementaryReport.update({
      where: {
        id: supplementaryId,
      },
      data: {
        status: SupplementaryReportStatus.SUBMITTED,
      },
    });
    await createSupplementaryHistory(
      supplementaryId,
      userId,
      SupplementaryReportStatus.SUBMITTED,
      comment,
      tx,
    );
    if (suppReport.modelYearReportId) {
      await updateMyrSupplementaryStatus(
        suppReport.modelYearReportId,
        SupplementaryReportStatus.SUBMITTED,
        tx,
      );
    }
  });
  return getSuccessActionResponse();
};

export const acknowledgeSupplementary = async (
  supplementaryId: number,
  comment?: string,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userIsGov, userId } = await getUserInfo();
  if (!userIsGov) {
    return getErrorActionResponse("Unauthorized!");
  }
  const suppReport = await prisma.supplementaryReport.findUnique({
    where: {
      id: supplementaryId,
      status: SupplementaryReportStatus.SUBMITTED,
    },
    select: {
      id: true,
      modelYearReportId: true,
    },
  });
  if (!suppReport) {
    return getErrorActionResponse("Invalid Action!");
  }
  await prisma.$transaction(async (tx) => {
    await tx.supplementaryReport.update({
      where: {
        id: supplementaryId,
      },
      data: {
        status: SupplementaryReportStatus.ACKNOWLEDGED,
      },
    });
    await createSupplementaryHistory(
      supplementaryId,
      userId,
      SupplementaryReportStatus.ACKNOWLEDGED,
      comment,
      tx,
    );
    if (suppReport.modelYearReportId) {
      await updateMyrSupplementaryStatus(
        suppReport.modelYearReportId,
        SupplementaryReportStatus.ACKNOWLEDGED,
        tx,
      );
    }
  });
  return getSuccessActionResponse();
};
