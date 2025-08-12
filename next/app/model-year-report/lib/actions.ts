"use server";

import { Directory } from "@/app/lib/constants/minio";
import {
  getPresignedGetObjectUrl,
  getPresignedPutObjectUrl,
  removeObject,
} from "@/app/lib/minio";
import { AssessmentTemplate, ForecastTemplate, MyrTemplate } from "./constants";
import { getUserInfo } from "@/auth";
import {
  ModelYear,
  ModelYearReportStatus,
  ModelYearReportSupplierStatus,
  Prisma,
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
  getDataActionResponse,
  getErrorActionResponse,
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
  const { userOrgId, userId } = await getUserInfo();
  const myrFullObjectName = getReportFullObjectName(
    userOrgId,
    "myr",
    myrObjectName,
  );
  const forecastFullObjectName = getReportFullObjectName(
    userOrgId,
    "forecast",
    forecastObjectName,
  );
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
    await removeObject(myrFullObjectName);
    await removeObject(forecastFullObjectName);
    if (e instanceof Error) {
      return getErrorActionResponse(e.message);
    }
    throw e;
  }
  return getDataActionResponse<number>(idOfCreatedReport);
};

export const getReportDownloadUrls = async (id: number) => {
  const { userIsGov, userOrgId } = await getUserInfo();
  const whereClause: Prisma.ModelYearReportWhereUniqueInput = { id };
  if (!userIsGov) {
    whereClause.organizationId = userOrgId;
  }
  const myr = await prisma.modelYearReport.findUnique({
    where: whereClause,
    select: {
      organizationId: true,
      objectName: true,
      fileName: true,
      forecastReportObjectName: true,
      forecastReportFileName: true,
    },
  });
  if (!myr) {
    return getErrorActionResponse("Model Year Report not found!");
  }
  return getDataActionResponse({
    myrUrl: await getPresignedGetObjectUrl(
      getReportFullObjectName(myr.organizationId, "myr", myr.objectName),
    ),
    myrFileName: myr.fileName,
    forecastUrl: await getPresignedGetObjectUrl(
      getReportFullObjectName(
        myr.organizationId,
        "forecast",
        myr.forecastReportObjectName,
      ),
    ),
    forecastFileName: myr.forecastReportFileName,
  });
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
