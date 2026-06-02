import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import { OrganizationAddressModel } from "@/prisma/generated/models";
import { getCurrentBalance, sumBalance } from "@/lib/utils/zevUnit";
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
    const balance = getCurrentBalance(
      org.zevUnitEndingBalances,
      org.zevUnitTransactions,
    );
    return {
      id: org.id,
      name: org.name,
      supplierClass,
      zevUnitBalanceA:
        balance === "deficit"
          ? "DEFICIT"
          : sumBalance(balance, "CREDIT", "REPORTABLE", "A").toFixed(2),
      zevUnitBalanceB:
        balance === "deficit"
          ? "DEFICIT"
          : sumBalance(balance, "CREDIT", "REPORTABLE", "B").toFixed(2),
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
