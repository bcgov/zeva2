import { prisma } from "@/lib/prisma";
import { ModelYear } from "@/prisma/generated/enums";
import { OrganizationModel } from "@/prisma/generated/models";
import { getUserInfo } from "@/auth";
import { getStringsToModelYearsEnumsMap } from "@/app/lib/utils/enumMaps";
import { getOrgBalance } from "@/app/lib/services/balance";
import { getSummedBalances } from "@/lib/utils/zevUnit";
import { getAdjacentYear } from "@/app/lib/utils/complianceYear";

export async function getOrg(
  orgId: number,
): Promise<OrganizationModel | null | undefined> {
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
    const transactions = await prisma.zevUnitTransaction.findMany({
      where: { organizationId: orgId },
      select: { timestamp: true },
    });
    const endingBalances = await prisma.zevUnitEndingBalance.findMany({
      where: { organizationId: orgId },
      select: { complianceYear: true },
    });
    const modelYearsMap = getStringsToModelYearsEnumsMap();
    const years = new Set<ModelYear>();
    for (const { timestamp } of transactions) {
      const y = timestamp.getFullYear();
      const m = timestamp.getMonth();
      const complianceYear = m >= 9 ? y : y - 1;
      const modelYear = modelYearsMap[complianceYear.toString()];
      if (modelYear) {
        years.add(modelYear);
      }
    }
    for (const { complianceYear } of endingBalances) {
      years.add(complianceYear);
      years.add(getAdjacentYear("next", complianceYear));
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

export const getReportableBalanceABU = async (orgId: number) => {
  const { userIsGov, userOrgId } = await getUserInfo();
  if (!userIsGov && userOrgId !== orgId) {
    throw new Error("Unexpected Error!");
  }
  const balance = await getOrgBalance(orgId);
  return getSummedBalances(balance);
};

export const getNestedReportableBalanceABU = async (orgId: number) => {
  const { userIsGov, userOrgId } = await getUserInfo();
  if (!userIsGov && userOrgId !== orgId) {
    throw new Error("Unexpected Error!");
  }
  const balance = await getOrgBalance(orgId);
  return {
    debits: {
      A: balance.DEBIT?.REPORTABLE?.A ?? {},
      B: balance.DEBIT?.REPORTABLE?.B ?? {},
      Unspecified: balance.DEBIT?.REPORTABLE?.UNSPECIFIED ?? {},
    },
    credits: {
      A: balance.CREDIT?.REPORTABLE?.A ?? {},
      B: balance.CREDIT?.REPORTABLE?.B ?? {},
      Unspecified: balance.CREDIT?.REPORTABLE?.UNSPECIFIED ?? {},
    },
  };
};
