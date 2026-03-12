"use server";

import { Directory, getAttachmentPutData } from "@/app/lib/services/s3";
import { getPresignedGetObjectUrl } from "@/app/lib/services/s3";
import { AssessmentTemplate, ForecastTemplate, MyrTemplate } from "./constants";
import { getUserInfo } from "@/auth";
import {
  ModelYear,
  ModelYearReportStatus,
  Notification,
  ReassessmentStatus,
  Role,
  SupplierClass,
  VehicleClass,
  ZevClass,
} from "@/prisma/generated/enums";
import { SupplyVolumeCreateManyInput } from "@/prisma/generated/models";
import {
  createHistory,
  createReassessmentHistory,
  createSupplementaryHistory,
  getAssessmentSystemData,
  getDataForSupplementary,
  getDataForReassessment,
  getZevUnitData,
  MyrZevUnitTransaction,
  areTransfersCovered,
  getSupplierClassAndVolumes,
  getVehicleStatistics,
  updateOrgSupplierClass,
  checkReassessmentGuard,
  createReassessmentGuard,
  deleteReassessmentGuard,
  assessReassessment,
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
  getComplianceDate,
  getModelYearReportModelYear,
} from "@/app/lib/utils/complianceYear";
import { addJobToEmailQueue } from "@/app/lib/services/queue";
import { Buffer } from "node:buffer";

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

export const getMyrPutData = async () => {
  return (await getAttachmentPutData(Directory.ModelYearReport, 1))[0];
};

export const getForecastPutData = async () => {
  return (await getAttachmentPutData(Directory.Forecast, 1))[0];
};

export const saveReports = async (
  modelYear: ModelYear,
  myrObjectName: string,
  forecastObjectName: string,
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
    },
  });
  if (existingMyr) {
    const status = existingMyr.status;
    if (
      status !== ModelYearReportStatus.DRAFT &&
      status !== ModelYearReportStatus.RETURNED_TO_SUPPLIER
    ) {
      return getErrorActionResponse("Invalid Action!");
    }
  }
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
          organizationId: userOrgId,
          modelYear,
        },
      });
      idOfReport = newId;
    }
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
      modelYear: true,
    },
  });
  if (!myr) {
    return getErrorActionResponse("Invalid Action!");
  }
  const reportYear = getModelYearReportModelYear();
  if (reportYear !== myr.modelYear) {
    return getErrorActionResponse("Invalid Action!");
  }
  const existingLegacyAssessedReport =
    await prisma.legacyAssessedModelYearReport.findUnique({
      where: {
        organizationId_modelYear: {
          organizationId: userOrgId,
          modelYear: myr.modelYear,
        },
      },
      select: {
        id: true,
      },
    });
  if (existingLegacyAssessedReport) {
    return getErrorActionResponse("Invalid Action!");
  }
  await prisma.$transaction(async (tx) => {
    await tx.modelYearReport.update({
      where: {
        id: myrId,
      },
      data: {
        status: ModelYearReportStatus.SUBMITTED_TO_GOVERNMENT,
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
    await tx.supplementaryReportAttachment.deleteMany({
      where: {
        supplementaryReport: {
          modelYearReportId: myrId,
        },
      },
    });
    await tx.supplementaryReportHistory.deleteMany({
      where: {
        supplementaryReport: {
          modelYearReportId: myrId,
        },
      },
    });
    await tx.supplementaryReportReassessment.deleteMany({
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
    await tx.modelYearReportAttachment.deleteMany({
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

export const getAssessmentPutData = async () => {
  return (await getAttachmentPutData(Directory.Assessment, 1))[0];
};

export const createOrSaveAssessment = async (
  myrId: number,
  assessmentObjectName: string,
): Promise<ErrorOrSuccessActionResponse> => {
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
  await prisma.assessment.upsert({
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
  return getSuccessActionResponse();
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
      if (returnType === ModelYearReportStatus.RETURNED_TO_SUPPLIER) {
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
        data: {
          status: returnType,
        },
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
    const nvData: SupplyVolumeCreateManyInput[] = [];
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
      await updateOrgSupplierClass(
        organizationId,
        modelYear,
        assessmentData.supplierClass,
        tx,
      );
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

export const getReassessmentPutData = async () => {
  return (await getAttachmentPutData(Directory.Reassessment, 1))[0];
};

export const createReassessment = async (
  organizationId: number,
  modelYear: ModelYear,
  reassessmentObjectName: string,
): Promise<DataOrErrorActionResponse<number>> => {
  let reassessmentId = NaN;
  const { userIsGov, userRoles } = await getUserInfo();
  if (!userIsGov || !userRoles.includes(Role.ZEVA_IDIR_USER)) {
    return getErrorActionResponse("Unauthorized!");
  }
  let myrId;
  try {
    myrId = await getDataForReassessment(organizationId, modelYear);
  } catch (e) {
    return getErrorActionResponse("Invalid Action!");
  }
  const createdReassessment = await prisma.reassessment.create({
    data: {
      organizationId,
      modelYear,
      objectName: reassessmentObjectName,
      status: ReassessmentStatus.DRAFT,
      modelYearReportId: myrId,
    },
  });
  reassessmentId = createdReassessment.id;
  return getDataActionResponse(reassessmentId);
};

export const saveReassessment = async (
  reassessmentId: number,
  reassessmentObjectName: string,
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
      id: true,
    },
  });
  if (!reassessment) {
    return getErrorActionResponse("Invalid Action!");
  }
  await prisma.reassessment.update({
    where: {
      id: reassessmentId,
    },
    data: {
      objectName: reassessmentObjectName,
    },
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
    },
  });
  if (!reassessment) {
    return getErrorActionResponse("Invalid Action!");
  }
  const organizationId = reassessment.organizationId;
  try {
    await getDataForReassessment(organizationId, reassessment.modelYear);
    await checkReassessmentGuard(organizationId);
  } catch {
    return getErrorActionResponse("Invalid Action!");
  }
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
    await createReassessmentGuard(organizationId, tx);
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
      id: true,
      organizationId: true,
    },
  });
  if (!reassessment) {
    return getErrorActionResponse("Valid Reassessment not found!");
  }
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
    await deleteReassessmentGuard(reassessment.organizationId, tx);
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
    await getDataForReassessment(organizationId, modelYear);
  } catch {
    return getErrorActionResponse("Invalid Action");
  }
  await prisma.$transaction(async (tx) => {
    await assessReassessment(
      reassessment.modelYearReportId,
      organizationId,
      modelYear,
      reassessment.objectName,
      tx,
    );
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
    await deleteReassessmentGuard(organizationId, tx);
  });
  return getSuccessActionResponse();
};

export const getSuppPutData = async () => {
  return (await getAttachmentPutData(Directory.Supplementary, 1))[0];
};

export const createSupplementary = async (
  modelYear: ModelYear,
  suppObjectName: string,
): Promise<DataOrErrorActionResponse<number>> => {
  let supplementaryId = NaN;
  const { userIsGov, userOrgId } = await getUserInfo();
  if (userIsGov) {
    return getErrorActionResponse("Unauthorized!");
  }
  let myrId;
  try {
    myrId = await getDataForSupplementary(userOrgId, modelYear);
  } catch (e) {
    return getErrorActionResponse("Invalid Action!");
  }
  const createdReport = await prisma.supplementaryReport.create({
    data: {
      organizationId: userOrgId,
      modelYear,
      objectName: suppObjectName,
      status: ModelYearReportStatus.DRAFT,
      modelYearReportId: myrId,
    },
  });
  supplementaryId = createdReport.id;
  return getDataActionResponse(supplementaryId);
};

export const saveSupplementary = async (
  supplementaryId: number,
  suppObjectName: string,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userIsGov, userOrgId } = await getUserInfo();
  if (userIsGov) {
    return getErrorActionResponse("Unauthorized!");
  }
  const suppReport = await prisma.supplementaryReport.findUnique({
    where: {
      id: supplementaryId,
      organizationId: userOrgId,
      status: ModelYearReportStatus.DRAFT,
    },
    select: {
      id: true,
    },
  });
  if (!suppReport) {
    return getErrorActionResponse("Invalid Action!");
  }
  await prisma.supplementaryReport.update({
    where: {
      id: supplementaryId,
    },
    data: {
      objectName: suppObjectName,
    },
  });
  return getSuccessActionResponse();
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
  if (!suppReport) {
    return getErrorActionResponse("Invalid Action!");
  }
  await prisma.$transaction(async (tx) => {
    await tx.supplementaryReportAttachment.deleteMany({
      where: {
        supplementaryReportId: supplementaryId,
      },
    });
    await tx.supplementaryReportHistory.deleteMany({
      where: {
        supplementaryReportId: supplementaryId,
      },
    });
    await tx.supplementaryReport.delete({
      where: {
        id: supplementaryId,
      },
    });
  });

  return getSuccessActionResponse();
};

export const submitSupplementaryToGovernment = async (
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
  if (!suppReport) {
    return getErrorActionResponse("Invalid Action!");
  }
  await prisma.$transaction(async (tx) => {
    await tx.supplementaryReport.update({
      where: {
        id: supplementaryId,
      },
      data: {
        status: ModelYearReportStatus.SUBMITTED_TO_GOVERNMENT,
      },
    });
    await createSupplementaryHistory(
      supplementaryId,
      userId,
      ModelYearReportStatus.SUBMITTED_TO_GOVERNMENT,
      comment,
      tx,
    );
  });
  return getSuccessActionResponse();
};

export const returnSupplementaryToSupplier = async (
  suppId: number,
  comment?: string,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userIsGov, userId, userRoles } = await getUserInfo();
  if (!userIsGov || !userRoles.includes(Role.ZEVA_IDIR_USER)) {
    return getErrorActionResponse("Unauthorized!");
  }
  const supp = await prisma.supplementaryReport.findUnique({
    where: {
      id: suppId,
      status: ModelYearReportStatus.SUBMITTED_TO_GOVERNMENT,
    },
    select: {
      id: true,
      supplementaryReportReassessment: {
        select: {
          id: true,
        },
      },
    },
  });
  if (!supp) {
    return getErrorActionResponse("Invalid Action!");
  }
  await prisma.$transaction(async (tx) => {
    if (supp.supplementaryReportReassessment) {
      await tx.supplementaryReportReassessment.delete({
        where: {
          id: supp.supplementaryReportReassessment.id,
        },
      });
    }
    await tx.supplementaryReport.update({
      where: {
        id: suppId,
      },
      data: {
        status: ModelYearReportStatus.RETURNED_TO_SUPPLIER,
      },
    });
    await createSupplementaryHistory(
      suppId,
      userId,
      ModelYearReportStatus.RETURNED_TO_SUPPLIER,
      comment,
      tx,
    );
  });
  return getSuccessActionResponse();
};

export const getSupplementaryReassessmentPutData = async () => {
  return (
    await getAttachmentPutData(Directory.SupplementaryReassessment, 1)
  )[0];
};

export const createOrSaveSupplementaryReassessment = async (
  suppId: number,
  reassessmentObjectName: string,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userIsGov, userRoles } = await getUserInfo();
  if (!userIsGov || !userRoles.includes(Role.ZEVA_IDIR_USER)) {
    return getErrorActionResponse("Unauthorized!");
  }
  const supp = await prisma.supplementaryReport.findUnique({
    where: {
      id: suppId,
      status: {
        in: [
          ModelYearReportStatus.SUBMITTED_TO_GOVERNMENT,
          ModelYearReportStatus.RETURNED_TO_ANALYST,
        ],
      },
    },
    select: {
      id: true,
    },
  });
  if (!supp) {
    return getErrorActionResponse("Invalid Action!");
  }
  await prisma.supplementaryReportReassessment.upsert({
    where: {
      supplementaryReportId: suppId,
    },
    create: {
      supplementaryReportId: suppId,
      objectName: reassessmentObjectName,
    },
    update: {
      objectName: reassessmentObjectName,
    },
  });
  return getSuccessActionResponse();
};

export const submitSupplementaryToDirector = async (
  suppId: number,
  comment?: string,
) => {
  const { userIsGov, userId, userRoles } = await getUserInfo();
  if (!userIsGov || !userRoles.includes(Role.ZEVA_IDIR_USER)) {
    return getErrorActionResponse("Unauthorized!");
  }
  const supp = await prisma.supplementaryReport.findUnique({
    where: {
      id: suppId,
      status: {
        in: [
          ModelYearReportStatus.SUBMITTED_TO_GOVERNMENT,
          ModelYearReportStatus.RETURNED_TO_ANALYST,
        ],
      },
      supplementaryReportReassessment: {
        isNot: null,
      },
    },
    select: {
      organizationId: true,
      modelYear: true,
    },
  });
  if (!supp) {
    return getErrorActionResponse("Invalid Action!");
  }
  try {
    await getDataForReassessment(supp.organizationId, supp.modelYear);
    await checkReassessmentGuard(supp.organizationId);
  } catch {
    return getErrorActionResponse("Invalid Action!");
  }
  await prisma.$transaction(async (tx) => {
    await tx.supplementaryReport.update({
      where: {
        id: suppId,
      },
      data: {
        status: ModelYearReportStatus.SUBMITTED_TO_DIRECTOR,
      },
    });
    await createSupplementaryHistory(
      suppId,
      userId,
      ModelYearReportStatus.SUBMITTED_TO_DIRECTOR,
      comment,
      tx,
    );
    await createReassessmentGuard(supp.organizationId, tx);
  });
  return getSuccessActionResponse();
};

export const returnSupplementaryToAnalyst = async (
  suppId: number,
  comment?: string,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userIsGov, userId, userRoles } = await getUserInfo();
  if (!userIsGov || !userRoles.includes(Role.DIRECTOR)) {
    return getErrorActionResponse("Unauthorized!");
  }
  const supp = await prisma.supplementaryReport.findUnique({
    where: {
      id: suppId,
      status: ModelYearReportStatus.SUBMITTED_TO_DIRECTOR,
    },
    select: {
      organizationId: true,
    },
  });
  if (!supp) {
    return getErrorActionResponse("Invalid Action!");
  }
  await prisma.$transaction(async (tx) => {
    await tx.supplementaryReport.update({
      where: {
        id: suppId,
      },
      data: {
        status: ModelYearReportStatus.RETURNED_TO_ANALYST,
      },
    });
    await createSupplementaryHistory(
      suppId,
      userId,
      ModelYearReportStatus.RETURNED_TO_ANALYST,
      comment,
      tx,
    );
    await deleteReassessmentGuard(supp.organizationId, tx);
  });
  return getSuccessActionResponse();
};

export const assessSupplementary = async (
  suppId: number,
  comment?: string,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userIsGov, userId, userRoles } = await getUserInfo();
  if (!userIsGov || !userRoles.includes(Role.DIRECTOR)) {
    return getErrorActionResponse("Unauthorized!");
  }
  const supp = await prisma.supplementaryReport.findUnique({
    where: {
      id: suppId,
      status: ModelYearReportStatus.SUBMITTED_TO_DIRECTOR,
    },
    select: {
      modelYearReportId: true,
      organizationId: true,
      modelYear: true,
      supplementaryReportReassessment: {
        select: {
          objectName: true,
        },
      },
    },
  });
  if (!supp) {
    return getErrorActionResponse("Invalid Action");
  }
  const suppReassessment = supp.supplementaryReportReassessment;
  if (!suppReassessment) {
    return getErrorActionResponse("Invalid Action");
  }
  const organizationId = supp.organizationId;
  const modelYear = supp.modelYear;
  try {
    await getDataForReassessment(organizationId, modelYear);
  } catch {
    return getErrorActionResponse("Invalid Action");
  }
  await prisma.$transaction(async (tx) => {
    await assessReassessment(
      supp.modelYearReportId,
      organizationId,
      modelYear,
      suppReassessment.objectName,
      tx,
    );
    await tx.supplementaryReport.update({
      where: {
        id: suppId,
      },
      data: {
        status: ModelYearReportStatus.ASSESSED,
      },
    });
    await createSupplementaryHistory(
      suppId,
      userId,
      ModelYearReportStatus.ASSESSED,
      comment,
      tx,
    );
    await deleteReassessmentGuard(organizationId, tx);
  });
  return getSuccessActionResponse();
};
