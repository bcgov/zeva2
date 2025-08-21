"use server";

import { Directory } from "@/app/lib/constants/minio";
import {
  getPresignedGetObjectUrl,
  getPresignedPutObjectUrl,
  removeObject,
  removeObjects,
} from "@/app/lib/minio";
import { AssessmentTemplate, ForecastTemplate, MyrTemplate } from "./constants";
import { getUserInfo } from "@/auth";
import {
  BalanceType,
  ModelYear,
  ModelYearReportStatus,
  ModelYearReportSupplierStatus,
  Prisma,
  ReferenceType,
  Role,
  VehicleClass,
  ZevClass,
} from "@/prisma/generated/client";
import {
  createHistory,
  getOrgDetails,
  getZevUnitData,
  MyrZevUnitTransaction,
  OrgNameAndAddresses,
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
} from "./utils";
import { SupplierClass } from "@/app/lib/constants/complianceRatio";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { getComplianceDate } from "@/app/lib/utils/complianceYear";
import { getModelYearEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { AttachmentDownload } from "@/app/lib/services/attachments";

export const getMyrTemplateUrl = async () => {
  return await getPresignedGetObjectUrl(
    `${Directory.Templates}/${MyrTemplate.Name}`,
  );
};

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
  supplierData: SupplierData;
  prevEndingBalance: MyrEndingBalance;
  complianceReductions: MyrComplianceReductions;
  offsets: MyrOffsets;
  currentTransactions: MyrCurrentTransactions;
};

export const getMyrData = async (
  modelYear: ModelYear,
  nvValues: NvValues,
  zevClassOrdering: ZevClass[],
): Promise<DataOrErrorActionResponse<MyrData>> => {
  const { userOrgId } = await getUserInfo();
  const orgData = await getOrgDetails(userOrgId);
  try {
    const {
      supplierClass,
      prevEndingBalance,
      complianceReductions,
      offsettedCredits,
      currentTransactions,
    } = await getZevUnitData(
      userOrgId,
      modelYear,
      nvValues,
      zevClassOrdering,
      [],
    );
    return getDataActionResponse<MyrData>({
      supplierData: { ...orgData, supplierClass },
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

export const getPutReportData = async () => {
  const { userOrgId } = await getUserInfo();
  const myrObjectName = randomUUID();
  const myrPutUrl = await getPresignedPutObjectUrl(
    getReportFullObjectName(userOrgId, "myr", myrObjectName),
  );
  const forecastObjectName = randomUUID();
  const forecastPutUrl = await getPresignedPutObjectUrl(
    getReportFullObjectName(userOrgId, "forecast", forecastObjectName),
  );
  return {
    myr: {
      objectName: myrObjectName,
      url: myrPutUrl,
    },
    forecast: {
      objectName: forecastObjectName,
      url: forecastPutUrl,
    },
  };
};

export const submitReports = async (
  modelYear: ModelYear,
  myrObjectName: string,
  myrFileName: string,
  forecastObjectName: string,
  forecastFileName: string,
  comment?: string,
): Promise<DataOrErrorActionResponse<number>> => {
  let idOfCreatedReport = NaN;
  const { userIsGov, userOrgId, userId } = await getUserInfo();
  if (userIsGov) {
    return getErrorActionResponse("Unauthorized!");
  }
  try {
    await prisma.$transaction(async (tx) => {
      const { id } = await tx.modelYearReport.create({
        data: {
          organizationId: userOrgId,
          modelYear,
          status: ModelYearReportStatus.SUBMITTED_TO_GOVERNMENT,
          supplierStatus: ModelYearReportSupplierStatus.SUBMITTED_TO_GOVERNMENT,
          fileName: myrFileName,
          objectName: myrObjectName,
          forecastReportFileName: forecastFileName,
          forecastReportObjectName: forecastObjectName,
        },
      });
      idOfCreatedReport = id;
      await createHistory(
        id,
        userId,
        ModelYearReportStatus.SUBMITTED_TO_GOVERNMENT,
        comment,
        tx,
      );
    });
  } catch (e) {
    await removeObjects([
      getReportFullObjectName(userOrgId, "myr", myrObjectName),
      getReportFullObjectName(userOrgId, "forecast", forecastObjectName),
    ]);
    if (e instanceof Error) {
      return getErrorActionResponse(e.message);
    }
    throw e;
  }
  return getDataActionResponse<number>(idOfCreatedReport);
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
  complianceInfo: ComplianceInfo;
  complianceReductions: MyrComplianceReductions;
  endingBalance: MyrEndingBalance;
  offsets: MyrOffsets;
  currentTransactions: MyrCurrentTransactions;
};

export const getAssessmentData = async (
  organizationId: number,
  modelYear: ModelYear,
  nvValues: NvValues,
  zevClassOrdering: ZevClass[],
  adjustments: AdjustmentPayload[],
): Promise<DataOrErrorActionResponse<AssessmentData>> => {
  const { userIsGov } = await getUserInfo();
  if (!userIsGov) {
    return getErrorActionResponse("Unauthorized!");
  }
  try {
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
      nvValues,
      zevClassOrdering,
      adjustments,
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

export const getPutAssessmentData = async (
  orgId: number,
): Promise<
  DataOrErrorActionResponse<{
    objectName: string;
    url: string;
  }>
> => {
  const { userIsGov } = await getUserInfo();
  if (!userIsGov) {
    return getErrorActionResponse("Unauthorized");
  }
  const assessmentObjectName = randomUUID();
  const assessmentPutUrl = await getPresignedPutObjectUrl(
    getReportFullObjectName(orgId, "assessment", assessmentObjectName),
  );
  return getDataActionResponse({
    objectName: assessmentObjectName,
    url: assessmentPutUrl,
  });
};

export const submitToDirector = async (
  id: number,
  organizationId: number,
  assessmentObjectName: string,
  assessmentFileName: string,
  comment?: string,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userIsGov, userId, userRoles } = await getUserInfo();
  const assessmentFullObjectName = getReportFullObjectName(
    organizationId,
    "assessment",
    assessmentObjectName,
  );
  try {
    if (!userIsGov || !userRoles.includes(Role.ENGINEER_ANALYST)) {
      throw new Error("Unauthorized!");
    }
    const myr = await prisma.modelYearReport.findUnique({
      where: {
        id,
        organizationId,
      },
      select: {
        status: true,
        assessmentObjectName: true,
      },
    });
    if (!myr) {
      throw new Error("Model Year Report does not exist!");
    }
    const status = myr.status;
    const prevAssessmentObjectName = myr.assessmentObjectName;
    if (
      status !== ModelYearReportStatus.SUBMITTED_TO_GOVERNMENT &&
      status !== ModelYearReportStatus.RETURNED_TO_ANALYST
    ) {
      throw new Error("Invalid action!");
    }
    await prisma.$transaction(async (tx) => {
      await tx.modelYearReport.update({
        where: {
          id,
        },
        data: {
          status: ModelYearReportStatus.SUBMITTED_TO_DIRECTOR,
          assessmentObjectName,
          assessmentFileName,
        },
      });
      await createHistory(
        id,
        userId,
        ModelYearReportStatus.SUBMITTED_TO_DIRECTOR,
        comment,
        tx,
      );
      if (prevAssessmentObjectName) {
        await removeObject(
          getReportFullObjectName(
            organizationId,
            "assessment",
            prevAssessmentObjectName,
          ),
        );
      }
    });
  } catch (e) {
    await removeObject(assessmentFullObjectName);
    if (e instanceof Error) {
      return getErrorActionResponse(e.message);
    }
    throw e;
  }
  return getSuccessActionResponse();
};

export const getDocumentDownloadUrls = async (
  id: number,
): Promise<
  DataOrErrorActionResponse<{
    documents: AttachmentDownload[];
    zipName: string;
  }>
> => {
  const { userIsGov, userOrgId } = await getUserInfo();
  const whereClause: Prisma.ModelYearReportWhereUniqueInput = { id };
  if (!userIsGov) {
    whereClause.organizationId = userOrgId;
  }
  const myr = await prisma.modelYearReport.findUnique({
    where: whereClause,
    select: {
      modelYear: true,
      organizationId: true,
      organization: {
        select: {
          name: true,
        },
      },
      status: true,
      fileName: true,
      objectName: true,
      forecastReportFileName: true,
      forecastReportObjectName: true,
      assessmentFileName: true,
      assessmentObjectName: true,
    },
  });
  if (!myr) {
    return getErrorActionResponse("Model Year Report not found!");
  }
  const orgId = myr.organizationId;
  const modelYearsMap = getModelYearEnumsToStringsMap();
  const documents: AttachmentDownload[] = [
    {
      fileName: myr.fileName,
      url: await getPresignedGetObjectUrl(
        getReportFullObjectName(orgId, "myr", myr.objectName),
      ),
    },
    {
      fileName: myr.forecastReportFileName,
      url: await getPresignedGetObjectUrl(
        getReportFullObjectName(
          orgId,
          "forecast",
          myr.forecastReportObjectName,
        ),
      ),
    },
  ];
  if (
    myr.assessmentFileName &&
    myr.assessmentObjectName &&
    (userIsGov || myr.status === ModelYearReportStatus.ASSESSED)
  ) {
    documents.push({
      fileName: myr.assessmentFileName,
      url: await getPresignedGetObjectUrl(
        getReportFullObjectName(orgId, "assessment", myr.assessmentObjectName),
      ),
    });
  }
  return getDataActionResponse({
    zipName: `model-year-report-documents-${myr.organization.name.replaceAll(" ", "-")}-${modelYearsMap[myr.modelYear]}`,
    documents,
  });
};

export const handleReturns = async (
  id: number,
  returnType: ModelYearReportStatus,
  comment?: string,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userIsGov, userId, userRoles } = await getUserInfo();
  if (!userIsGov) {
    return getErrorActionResponse("Unauthorized!");
  }
  const myr = await prisma.modelYearReport.findUnique({
    where: { id },
    select: {
      status: true,
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
      userRoles.includes(Role.ENGINEER_ANALYST))
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
          id,
        },
        data: updateData,
      });
      await createHistory(id, userId, returnType, comment, tx);
    });
    return getSuccessActionResponse();
  }
  return getErrorActionResponse("Invalid Action!");
};

export const resubmitReports = async (
  id: number,
  myrObjectName: string,
  myrFileName: string,
  forecastObjectName: string,
  forecastFileName: string,
  comment?: string,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userIsGov, userOrgId, userId } = await getUserInfo();
  if (userIsGov) {
    return getErrorActionResponse("Unauthorized!");
  }
  const myr = await prisma.modelYearReport.findUnique({
    where: {
      id,
      organizationId: userOrgId,
      status: ModelYearReportStatus.RETURNED_TO_SUPPLIER,
    },
  });
  if (!myr) {
    return getErrorActionResponse("Model Year Report not found!");
  }
  try {
    await prisma.$transaction(async (tx) => {
      await tx.modelYearReport.update({
        where: {
          id,
        },
        data: {
          status: ModelYearReportStatus.SUBMITTED_TO_GOVERNMENT,
          supplierStatus: ModelYearReportStatus.SUBMITTED_TO_GOVERNMENT,
          fileName: myrFileName,
          objectName: myrObjectName,
          forecastReportFileName: forecastFileName,
          forecastReportObjectName: forecastObjectName,
        },
      });
      await createHistory(
        id,
        userId,
        ModelYearReportStatus.SUBMITTED_TO_GOVERNMENT,
        comment,
        tx,
      );
      await removeObjects([
        getReportFullObjectName(userOrgId, "myr", myr.objectName),
        getReportFullObjectName(
          userOrgId,
          "forecast",
          myr.forecastReportObjectName,
        ),
      ]);
    });
  } catch (e) {
    await removeObjects([
      getReportFullObjectName(userOrgId, "myr", myrObjectName),
      getReportFullObjectName(userOrgId, "forecast", forecastObjectName),
    ]);
    if (e instanceof Error) {
      return getErrorActionResponse(e.message);
    }
    throw e;
  }
  return getSuccessActionResponse();
};

export type AssessmentPayload = {
  nv: number;
  transactions: (Omit<ZevUnitRecord, "numberOfUnits"> & {
    numberOfUnits: string;
    referenceType: ReferenceType;
  })[];
  endingBalance: (Omit<ZevUnitRecord, "type" | "numberOfUnits"> & {
    type: BalanceType;
    initialNumberOfUnits: string;
    finalNumberOfUnits: string;
  })[];
};

export const directorAssess = async (
  id: number,
  assessmentPayload: AssessmentPayload,
  comment?: string,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userIsGov, userId, userRoles } = await getUserInfo();
  if (!userIsGov || !userRoles.includes(Role.DIRECTOR)) {
    return getErrorActionResponse("Unauthorized!");
  }
  const myr = await prisma.modelYearReport.findUnique({
    where: {
      id,
      status: ModelYearReportStatus.SUBMITTED_TO_DIRECTOR,
    },
  });
  if (!myr) {
    return getErrorActionResponse("Model Year Report not found!");
  }
  const modelYear = myr.modelYear;
  const organizationId = myr.organizationId;
  try {
    const complianceDate = getComplianceDate(modelYear);
    await prisma.$transaction(async (tx) => {
      await tx.supplyVolume.create({
        data: {
          organizationId,
          modelYear,
          volume: assessmentPayload.nv,
        },
      });
      await tx.zevUnitTransaction.createMany({
        data: assessmentPayload.transactions.map((transaction) => {
          return {
            ...transaction,
            organizationId,
            referenceId: myr.id,
            timestamp: complianceDate,
          };
        }),
      });
      await tx.zevUnitEndingBalance.createMany({
        data: assessmentPayload.endingBalance.map((record) => {
          return { ...record, organizationId, complianceYear: modelYear };
        }),
      });
      await tx.modelYearReport.update({
        where: {
          id,
        },
        data: {
          status: ModelYearReportStatus.ASSESSED,
          supplierStatus: ModelYearReportStatus.ASSESSED,
        },
      });
      await createHistory(
        id,
        userId,
        ModelYearReportStatus.ASSESSED,
        comment,
        tx,
      );
    });
  } catch (e) {
    if (e instanceof Error) {
      return getErrorActionResponse(e.message);
    }
    throw e;
  }
  return getSuccessActionResponse();
};

export const getDownloadAssessmentUrl = async (
  id: number,
): Promise<DataOrErrorActionResponse<string>> => {
  const { userIsGov } = await getUserInfo();
  if (!userIsGov) {
    return getErrorActionResponse("Unauthorized!");
  }
  const myr = await prisma.modelYearReport.findUnique({
    where: {
      id,
    },
    select: {
      organizationId: true,
      assessmentFileName: true,
      assessmentObjectName: true,
    },
  });
  if (!myr || !myr.assessmentFileName || !myr.assessmentObjectName) {
    return getErrorActionResponse("Assessment not found!");
  }
  const url = await getPresignedGetObjectUrl(
    getReportFullObjectName(
      myr.organizationId,
      "assessment",
      myr.assessmentObjectName,
    ),
  );
  return getDataActionResponse(url);
};
