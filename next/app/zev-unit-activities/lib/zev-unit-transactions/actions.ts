"use server";

import {
  DataOrErrorActionResponse,
  getDataActionResponse,
  getErrorActionResponse,
} from "@/app/lib/utils/actionResponse";
import {
  getAdjacentYear,
  getCompliancePeriod,
} from "@/app/lib/utils/complianceYear";
import { getIsoYmdString } from "@/app/lib/utils/date";
import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ModelYear } from "@/prisma/generated/enums";
import {
  SerializedZevUnitBalanceRecord,
  SerializedZevUnitTransaction,
} from "./constants";
import { getReportableBalanceAB } from "./data";

export const getTransactionsByComplianceYear = async (
  organizationId: number,
  complianceYear: ModelYear,
  timestampOrder: "asc" | "desc",
): Promise<DataOrErrorActionResponse<SerializedZevUnitTransaction[]>> => {
  const { userIsGov, userOrgId } = await getUserInfo();
  if (!userIsGov && userOrgId !== organizationId) {
    return getErrorActionResponse("Unauthorized!");
  }
  const { closedLowerBound, openUpperBound } =
    getCompliancePeriod(complianceYear);
  const records = await prisma.zevUnitTransaction.findMany({
    where: {
      organizationId,
      timestamp: { gte: closedLowerBound, lt: openUpperBound },
    },
    orderBy: { timestamp: timestampOrder },
  });
  const recordsToReturn = records.map((record) => {
    return {
      ...record,
      numberOfUnits: record.numberOfUnits.toFixed(2),
      timestamp: getIsoYmdString(record.timestamp),
    };
  });
  return getDataActionResponse(recordsToReturn);
};

export const getBeginningBalance = async (
  organizationId: number,
  complianceYear: ModelYear,
): Promise<DataOrErrorActionResponse<SerializedZevUnitBalanceRecord[]>> => {
  const { userIsGov, userOrgId } = await getUserInfo();
  if (!userIsGov && userOrgId !== organizationId) {
    return getErrorActionResponse("Unauthorized!");
  }
  const prevYear = getAdjacentYear("prev", complianceYear);
  const records = await prisma.zevUnitEndingBalance.findMany({
    where: {
      organizationId,
      complianceYear: prevYear,
    },
  });
  const recordsToReturn = records.map((record) => {
    const { finalNumberOfUnits, initialNumberOfUnits, ...rest } = record;
    return {
      ...rest,
      numberOfUnits: finalNumberOfUnits.toFixed(2),
    };
  });
  return getDataActionResponse(recordsToReturn);
};

export const getEndingBalance = async (
  organizationId: number,
  complianceYear: ModelYear,
): Promise<DataOrErrorActionResponse<SerializedZevUnitBalanceRecord[]>> => {
  const { userIsGov, userOrgId } = await getUserInfo();
  if (!userIsGov && userOrgId !== organizationId) {
    return getErrorActionResponse("Unauthorized!");
  }
  const records = await prisma.zevUnitEndingBalance.findMany({
    where: {
      organizationId,
      complianceYear,
    },
  });
  const recordsToReturn = records.map((record) => {
    const { finalNumberOfUnits, initialNumberOfUnits, ...rest } = record;
    return {
      ...rest,
      numberOfUnits: initialNumberOfUnits.toFixed(2),
    };
  });
  return getDataActionResponse(recordsToReturn);
};

export const getReportableBalanceABForSupplierUser = async () => {
  const { userOrgId } = await getUserInfo();
  return await getReportableBalanceAB(userOrgId);
};
