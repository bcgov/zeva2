"use server";

import { getCompliancePeriod } from "@/app/lib/utils/complianceYear";
import { getIsoYmdString } from "@/app/lib/utils/date";
import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ZevUnitTransaction } from "@/prisma/generated/client";

export async function getComplianceYears(orgId: number): Promise<number[]> {
  const { userIsGov, userOrgId } = await getUserInfo();
  if (userIsGov || userOrgId === orgId) {
    const rows = await prisma.zevUnitTransaction.findMany({
      where: { organizationId: orgId },
      select: { timestamp: true },
    });
    const years = new Set<number>();
    for (const { timestamp } of rows) {
      const y = timestamp.getFullYear();
      const m = timestamp.getMonth();
      const complianceYear = m >= 9 ? y : y - 1;
      years.add(complianceYear);
    }
    return Array.from(years).sort((a, b) => b - a);
  }
  return [];
}

export type SerializedZevUnitTransaction = Omit<
  ZevUnitTransaction,
  "numberOfUnits" | "timestamp"
> & { numberOfUnits: string; timestamp: string };

export async function getTransactionsByComplianceYear(
  orgId: number,
  year: number,
  timestampOrder: "asc" | "desc",
): Promise<SerializedZevUnitTransaction[]> {
  const result: SerializedZevUnitTransaction[] = [];
  const { userIsGov, userOrgId } = await getUserInfo();
  if ((userIsGov || userOrgId === orgId) && !Number.isNaN(year)) {
    const { closedLowerBound, openUpperBound } = getCompliancePeriod(year);
    const transactions = await prisma.zevUnitTransaction.findMany({
      where: {
        organizationId: orgId,
        timestamp: { gte: closedLowerBound, lt: openUpperBound },
      },
      orderBy: { timestamp: timestampOrder },
    });
    transactions.forEach((transaction) => {
      result.push({
        ...transaction,
        numberOfUnits: transaction.numberOfUnits.toString(),
        timestamp: getIsoYmdString(transaction.timestamp),
      });
    });
  }
  return result;
}
