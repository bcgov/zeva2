import { prisma } from "@/lib/prisma";
import {
  ZevUnitTransaction,
  ZevUnitEndingBalance,
  ModelYear,
  Prisma,
  Organization,
} from "@/prisma/generated/client";
import { getBalance, ZevUnitRecordsObj } from "../../../lib/utils/zevUnit";
import { getUserInfo } from "@/auth";
import { getModelYearEnumMap } from "@/app/lib/utils/enumMaps";
import { getCompliancePeriod } from "@/app/lib/utils/complianceYear";

export async function fetchTransactions(
  orgId: number,
  gteDate?: Date,
): Promise<ZevUnitTransaction[]> {
  const { userIsGov, userOrgId } = await getUserInfo();
  if (userIsGov || userOrgId === orgId) {
    const where: Prisma.ZevUnitTransactionWhereInput = {
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
): Promise<ZevUnitEndingBalance[]> {
  const { userIsGov, userOrgId } = await getUserInfo();
  if (userIsGov || userOrgId === orgId) {
    const where: Prisma.ZevUnitEndingBalanceWhereInput = {
      organizationId: orgId,
      complianceYear: complianceYear,
    };
    return prisma.zevUnitEndingBalance.findMany({ where });
  }
  return [];
}

export async function fetchBalance(
  orgId: number,
  modelYear?: ModelYear,
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
      const modelYearsMap = getModelYearEnumMap();
      const complianceYear = mostRecentEndingBalance.complianceYear;
      const intYear = parseInt(modelYearsMap[complianceYear] ?? "");
      if (Number.isNaN(intYear)) {
        return undefined;
      }
      const { closedLowerBound } = getCompliancePeriod(intYear + 1);
      const endingBalances = await fetchEndingBalances(orgId, complianceYear);
      const transactions = await fetchTransactions(orgId, closedLowerBound);
      return getBalance(endingBalances, transactions);
    } else {
      const transactions = await fetchTransactions(orgId);
      return getBalance([], transactions);
    }
  }
}

export async function getOrg(
  orgId: number,
): Promise<Organization | null | undefined> {
  const { userIsGov, userOrgId } = await getUserInfo();
  if (userIsGov || userOrgId === orgId) {
    return await prisma.organization.findUnique({
      where: { id: orgId },
    });
  }
}
