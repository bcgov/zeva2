import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import { OrganizationAddress } from "@/prisma/generated/client";
import { getCurrentBalance, sumBalance } from "@/lib/utils/zevUnit";
import { filterOrganizations, sortOrganzations } from "./utils";
import { getSupplierClassEnumsToStringsMap } from "@/app/lib/utils/enumMaps";

export type OrganizationSparse = {
  id: number;
  name: string;
  supplierClass: string;
  zevUnitBalanceA: string;
  zevUnitBalanceB: string;
};

export type OrganizationAddressSparse = Omit<
  OrganizationAddress,
  "id" | "organizationId" | "expirationDate" | "addressType"
>;

export const getAllSuppliers = async (
  activeOnly: boolean = false,
): Promise<OrganizationSparse[]> => {
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
      isActive: activeOnly ? true : undefined,
    },
    orderBy: {
      name: "asc",
    },
  });
  const supplierClassesMap = getSupplierClassEnumsToStringsMap();

  const supplierInfo = organizations.map((org) => {
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

  return supplierInfo;
};

// page is 1-based
// currently, this function is not used with SSR, so it is important to select only the data you need!
export const getOrganizations = async (
  page: number,
  pageSize: number,
  filters: { [key: string]: string },
  sorts: { [key: string]: string },
): Promise<[OrganizationSparse[], number]> => {
  const { userIsGov } = await getUserInfo();
  if (!userIsGov) {
    return [[], 0];
  }

  const organizations = filterOrganizations(
    await getAllSuppliers(true),
    filters,
  );
  sortOrganzations(organizations, sorts);
  const start = (page - 1) * pageSize;
  return [organizations.slice(start, start + pageSize), organizations.length];
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
