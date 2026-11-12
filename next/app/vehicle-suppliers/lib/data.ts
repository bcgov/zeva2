import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import { OrganizationAddressModel } from "@/prisma/generated/models";
import {
  balanceABUHasDeficit,
  getCurrentBalance,
  getSummedBalances,
} from "@/lib/utils/zevUnit";
import { getSupplierClassEnumsToStringsMap } from "@/app/lib/utils/enumMaps";

export type OrganizationSparse = {
  id: number;
  name: string;
  supplierClass: string;
  zevUnitBalanceA: string;
  zevUnitBalanceB: string;
};

export type OrganizationAddressSparse = Omit<
  OrganizationAddressModel,
  "id" | "organizationId" | "addressType"
>;

export const getSuppliers = async (): Promise<OrganizationSparse[]> => {
  const { userIsGov } = await getUserInfo();
  if (!userIsGov) {
    return [];
  }
  const organizations = await prisma.organization.findMany({
    select: {
      id: true,
      name: true,
      isActive: true,
      shortName: true,
      supplierClass: true,
      zevUnitTransactions: true,
      zevUnitEndingBalances: true,
    },
    where: {
      isGovernment: false,
    },
    orderBy: {
      name: "asc",
    },
  });
  const supplierClassesMap = getSupplierClassEnumsToStringsMap();
  const result = organizations.map((org) => {
    let supplierClass = "N/A";
    if (org.supplierClass) {
      supplierClass = supplierClassesMap[org.supplierClass] ?? "N/A";
    }
    let balance: ReturnType<typeof getCurrentBalance>;
    balance = getCurrentBalance(
      org.zevUnitEndingBalances,
      org.zevUnitTransactions,
    );
    const summedBalance = getSummedBalances(balance);
    return {
      id: org.id,
      name: org.name,
      supplierClass,
      zevUnitBalanceA: balanceABUHasDeficit(summedBalance)
        ? "DEFICIT"
        : summedBalance.credits.A,
      zevUnitBalanceB: balanceABUHasDeficit(summedBalance)
        ? "DEFICIT"
        : summedBalance.credits.B,
    };
  });
  return result;
};

export const getGovOrgId = async () => {
  const orgs = await prisma.organization.findMany({
    where: {
      isGovernment: true,
    },
  });
  if (orgs.length !== 1) {
    throw new Error("Something is terribly wrong!");
  }
  return orgs[0].id;
};
