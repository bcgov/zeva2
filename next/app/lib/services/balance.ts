import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ModelYear } from "@/prisma/generated/enums";
import {
  ZevUnitEndingBalanceModel,
  ZevUnitTransactionModel,
  ZevUnitTransactionWhereInput,
  ZevUnitEndingBalanceWhereInput,
} from "@/prisma/generated/models";
import { getBalance, ZevUnitRecordsObj } from "@/lib/utils/zevUnit";
import { getCompliancePeriod } from "@/app/lib/utils/complianceYear";

export async function fetchTransactions(
  orgId: number,
  gteDate?: Date,
): Promise<ZevUnitTransactionModel[]> {
  const { userIsGov, userOrgId } = await getUserInfo();
  if (userIsGov || userOrgId === orgId) {
    const where: ZevUnitTransactionWhereInput = {
      organizationId: orgId,
    };
    if (gteDate) {
      where.timestamp = { gte: gteDate };
    }
    return prisma.zevUnitTransaction.findMany({
      where,
      orderBy: { modelYear: "asc" },
    });
  }
  return [];
}

export async function fetchEndingBalances(
  orgId: number,
  complianceYear: ModelYear,
): Promise<ZevUnitEndingBalanceModel[]> {
  const { userIsGov, userOrgId } = await getUserInfo();
  if (userIsGov || userOrgId === orgId) {
    const where: ZevUnitEndingBalanceWhereInput = {
      organizationId: orgId,
      complianceYear: complianceYear,
    };
    return prisma.zevUnitEndingBalance.findMany({ where });
  }
  return [];
}

export async function fetchBalance(
  orgId: number,
): Promise<ZevUnitRecordsObj | "deficit" | undefined> {
  const { userIsGov, userOrgId } = await getUserInfo();
  if (userIsGov || userOrgId === orgId) {
    const mostRecentEndingBalance = await prisma.zevUnitEndingBalance.findFirst(
      {
        where: {
          organizationId: orgId,
        },
        select: {
          complianceYear: true,
        },
        orderBy: [{ complianceYear: "desc" }],
      },
    );
    if (mostRecentEndingBalance) {
      const complianceYear = mostRecentEndingBalance.complianceYear;
      const { openUpperBound: gteDate } = getCompliancePeriod(complianceYear);
      const endingBalances = await fetchEndingBalances(orgId, complianceYear);
      const transactions = await fetchTransactions(orgId, gteDate);
      return getBalance(endingBalances, transactions);
    } else {
      const transactions = await fetchTransactions(orgId);
      return getBalance([], transactions);
    }
  }
}
