"use server";

import { Directory } from "@/app/lib/constants/minio";
import { getPresignedGetObjectUrl } from "@/app/lib/minio";
import { ForecastTemplate, MyrTemplate } from "./constants";
import { getUserInfo } from "@/auth";
import { ModelYear, VehicleClass, ZevClass } from "@/prisma/generated/client";
import {
  getOrgDetails,
  getPrevEndingBalance,
  getSupplierClass,
  getTransactionsForModelYear,
  MyrZevUnitTransaction,
  OrgNameAndAddresses,
} from "./services";
import {
  DataOrErrorActionResponse,
  getDataActionResponse,
  getErrorActionResponse,
} from "@/app/lib/utils/actionResponse";
import { calculateBalance, ZevUnitRecord } from "@/lib/utils/zevUnit";
import {
  ComplianceReduction,
  getComplianceRatioReductions,
  getSerializedMyrRecords,
  getSerializedMyrRecordsExcludeKey,
  UnitsAsString,
} from "./utils";
import { SupplierClass } from "@/app/lib/constants/complianceRatio";

export const getMyrTemplateUrl = async () => {
  return await getPresignedGetObjectUrl(
    `${Directory.Templates}/${MyrTemplate.Name}`,
  );
};

export type NvValues = Partial<Record<VehicleClass, string>>;

export type SupplierData = OrgNameAndAddresses & {
  supplierClass: SupplierClass;
};

export type MyrPrevEndingBalance = UnitsAsString<ZevUnitRecord>[];

export type MyrComplianceReductions = Omit<
  UnitsAsString<ComplianceReduction>,
  "type"
>[];

export type MyrOffsets = Omit<UnitsAsString<ZevUnitRecord>, "type">[];

export type MyrCurrentTransactions = UnitsAsString<MyrZevUnitTransaction>[];

export type MyrData = {
  supplierData: SupplierData;
  prevEndingBalance: MyrPrevEndingBalance;
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
  try {
    const reportableNvValue = nvValues[VehicleClass.REPORTABLE];
    if (!reportableNvValue) {
      throw new Error("No Reportable NV Value!");
    }
    const orgData = await getOrgDetails(userOrgId);
    const supplierClass = await getSupplierClass(
      userOrgId,
      modelYear,
      reportableNvValue,
    );
    const prevEndingBalance = await getPrevEndingBalance(userOrgId, modelYear);
    const complianceReductions = getComplianceRatioReductions(
      nvValues,
      modelYear,
      supplierClass,
    );
    const currentTransactions = await getTransactionsForModelYear(
      userOrgId,
      modelYear,
    );
    const [_endingBalance, offsettedCredits] = calculateBalance(
      [...prevEndingBalance, ...currentTransactions, ...complianceReductions],
      zevClassOrdering,
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

export const submitMyr = async (
  reportObjectName: string,
  reportFileName: string,
  forecastObjectName: string,
  forecastFileName: string,
) => {};
