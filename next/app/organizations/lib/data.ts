import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentBalance, sumBalance } from "../../../lib/utils/zevUnit";
import { filterOrganizations, sortOrganzations } from "./utils";

export type OrganizationSparse = {
  id: number,
  name: string,
  zevUnitBalanceA: string,
  zevUnitBalanceB: string,
};

export const getAllSuppliers = async () => {
  const organizations = await prisma.organization.findMany({
    select: {
      id: true,
      name: true,
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

  const supplierInfo = organizations.map(org => {
    const balance = getCurrentBalance(org.zevUnitEndingBalances, org.zevUnitTransactions);
    return {
      id: org.id,
      name: org.name,
      zevUnitBalanceA: balance === "deficit" ?
        "DEFICIT" :
        sumBalance(balance, "CREDIT", "REPORTABLE", "A").toFixed(2),
      zevUnitBalanceB: balance === "deficit" ?
        "DEFICIT" :
        sumBalance(balance, "CREDIT", "REPORTABLE", "B").toFixed(2),
    }
  });

  return supplierInfo;
}

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

  const organizations = filterOrganizations(await getAllSuppliers(), filters);
  sortOrganzations(organizations, sorts);
  const start = (page - 1) * pageSize;

  return [organizations.slice(start, pageSize), organizations.length];
};