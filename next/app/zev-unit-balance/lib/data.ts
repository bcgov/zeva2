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
import { getCompliancePeriod } from "@/app/lib/utils/complianceYear";
import { getStringsToModelYearsEnumsMap } from "@/app/lib/utils/enumMaps";

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

export async function getComplianceYears(orgId: number): Promise<ModelYear[]> {
  const { userIsGov, userOrgId } = await getUserInfo();
  if (userIsGov || userOrgId === orgId) {
    const rows = await prisma.zevUnitTransaction.findMany({
      where: { organizationId: orgId },
      select: { timestamp: true },
    });
    const modelYearsMap = getStringsToModelYearsEnumsMap();
    const years = new Set<ModelYear>();
    for (const { timestamp } of rows) {
      const y = timestamp.getFullYear();
      const m = timestamp.getMonth();
      const complianceYear = m >= 9 ? y : y - 1;
      const modelYear = modelYearsMap[complianceYear.toString()];
      if (modelYear) {
        years.add(modelYear);
      }
    }
    return Array.from(years).sort((a, b) => {
      if (a < b) {
        return 1;
      }
      if (a > b) {
        return -1;
      }
      return 0;
    });
  }
  return [];
}
