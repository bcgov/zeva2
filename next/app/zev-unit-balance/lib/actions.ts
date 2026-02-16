"use server";

import { getCompliancePeriod } from "@/app/lib/utils/complianceYear";
import { getIsoYmdString } from "@/app/lib/utils/date";
import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ModelYear } from "@/prisma/generated/enums";
import { ZevUnitTransactionModel } from "@/prisma/generated/models";

export type SerializedZevUnitTransaction = Omit<
  ZevUnitTransactionModel,
  "numberOfUnits" | "timestamp"
> & { numberOfUnits: string; timestamp: string };

export async function getTransactionsByComplianceYear(
  orgId: number,
  year: ModelYear,
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
