import { prisma } from "@/lib/prisma";
import { ModelYear } from "@/prisma/generated/enums";
import { OrganizationModel } from "@/prisma/generated/models";
import { getUserInfo } from "@/auth";
import { getStringsToModelYearsEnumsMap } from "@/app/lib/utils/enumMaps";
export {
  fetchBalance,
  fetchEndingBalances,
  fetchTransactions,
} from "@/app/lib/services/balance";

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
