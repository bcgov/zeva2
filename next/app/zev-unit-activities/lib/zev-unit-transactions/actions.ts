"use server";

import {
  DataOrErrorActionResponse,
  getDataActionResponse,
  getErrorActionResponse,
} from "@/app/lib/utils/actionResponse";
import { getCompliancePeriod } from "@/app/lib/utils/complianceYear";
import { getIsoYmdString } from "@/app/lib/utils/date";
import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ModelYear } from "@/prisma/generated/enums";
import {
  SerializedZevUnitEndingBalanceRecord,
  SerializedZevUnitTransaction,
} from "./constants";

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

export const getEndingBalance = async (
  organizationId: number,
  complianceYear: ModelYear,
): Promise<
  DataOrErrorActionResponse<SerializedZevUnitEndingBalanceRecord[]>
> => {
  const { userIsGov, userOrgId } = await getUserInfo();
  if (!userIsGov && userOrgId !== organizationId) {
    return getErrorActionResponse("Unauthorized!");
  }
  const records = await prisma.zevUnitEndingBalance.findMany({
    where: {
      organizationId,
      complianceYear,
    },
    omit: {
      initialNumberOfUnits: true,
    },
  });
  const recordsToReturn = records.map((record) => {
    return {
      ...record,
      finalNumberOfUnits: record.finalNumberOfUnits.toFixed(2),
    };
  });
  return getDataActionResponse(recordsToReturn);
};
