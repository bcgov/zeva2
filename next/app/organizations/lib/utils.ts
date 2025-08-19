import { Prisma } from "@/prisma/generated/client";
import { OrganizationSparse, OrganizationAddressSparse } from "./data";
import { cleanupStringData } from "@/lib/utils/dataCleanup";

const YEARS_OF_AVG_SUPPLIED_VOL_USED = 3; // Number of years to average the supplied volume for LDVs

export const organizationLDVSuppliedClause: Prisma.Organization$ldvSuppliedArgs =
  {
    select: {
      modelYear: true,
      volume: true,
    },
    orderBy: { modelYear: "desc" },
    take: YEARS_OF_AVG_SUPPLIED_VOL_USED,
    distinct: ["modelYear"], // Ensure unique model years
  };

/**
 * Determines the supplier class based on the average supplied volume of LDVs.
 * @param ldvSupplied - volumes of LDVs supplied by the organization over the last few years,
 *                      already sorted by model year in descending order.
 * @returns the supplier class
 */
export const getSupplierClass = (ldvSupplied: { volume: number }[]) => {
  const volumes = ldvSupplied
    .slice(0, YEARS_OF_AVG_SUPPLIED_VOL_USED)
    .map((item) => item.volume)
    .filter((volume) => volume > 0);

  if (volumes.length === 0) {
    return "N/A";
  }
  const avgVolume =
    volumes.length !== YEARS_OF_AVG_SUPPLIED_VOL_USED
      ? volumes[0]
      : volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
  if (avgVolume < 1000) {
    return "SMALL";
  } else if (avgVolume < 5000) {
    return "MEDIUM";
  } else {
    return "LARGE";
  }
};

const decomposeFilterValue = (filterValue: string) => {
  let filterType = filterValue.substring(0, 2);
  if (filterType === "==" || filterType === ">=" || filterType === "<=") {
    const numberValue = parseFloat(filterValue.substring(2));
    return isNaN(numberValue)
      ? undefined
      : {
          filterType,
          numberValue,
        };
  }
  filterType = filterValue.substring(0, 1);
  if (filterType === "=" || filterType === ">" || filterType === "<") {
    const numberValue = parseFloat(filterValue.substring(1));
    return isNaN(numberValue)
      ? undefined
      : {
          filterType,
          numberValue,
        };
  }
  return undefined;
};

export const filterOrganizations = (
  organizations: OrganizationSparse[],
  filters: { [key: string]: string },
) => {
  for (const [key, rawValue] of Object.entries(filters)) {
    const value = rawValue.toLowerCase().trim();

    if (key === "zevUnitBalanceA" || key === "zevUnitBalanceB") {
      const decomposedValue = decomposeFilterValue(value);
      if (decomposedValue) {
        const { filterType, numberValue } = decomposedValue;
        organizations = organizations.filter((org) => {
          const orgValue = org[key];
          switch (filterType) {
            case "==":
            case "=":
              return parseFloat(orgValue) == numberValue;
            case ">":
              return parseFloat(orgValue) > numberValue;
            case "<":
              return parseFloat(orgValue) < numberValue;
            case ">=":
              return parseFloat(orgValue) >= numberValue;
            case "<=":
              return parseFloat(orgValue) <= numberValue;
            default:
              return false;
          }
        });
        continue;
      }
    }

    organizations = organizations.filter((org) =>
      org[key as keyof Omit<OrganizationSparse, "id">]
        .toLowerCase()
        .includes(value),
    );
  }
  return organizations;
};

export const sortOrganzations = (
  organizations: OrganizationSparse[],
  sorts: { [key: string]: string },
) => {
  for (const [key, value] of Object.entries(sorts)) {
    switch (key) {
      case "name":
        organizations.sort((a, b) =>
          value === "asc"
            ? a[key].localeCompare(b[key])
            : b[key].localeCompare(a[key]),
        );
        break;
      case "zevUnitBalanceA":
      case "zevUnitBalanceB":
        organizations.sort((a, b) => {
          const aValue = a[key] === "DEFICIT" ? -1 : parseFloat(a[key]);
          const bValue = b[key] === "DEFICIT" ? -1 : parseFloat(b[key]);
          return value === "asc" ? aValue - bValue : bValue - aValue;
        });
        break;
    }
  }
};

export const cleanupAddressData = (address?: OrganizationAddressSparse) => {
  if (!address) {
    return undefined;
  }
  const cleanedAddress: OrganizationAddressSparse = { ...address };
  for (const key in cleanedAddress) {
    cleanedAddress[key as keyof OrganizationAddressSparse] = cleanupStringData(
      cleanedAddress[key as keyof OrganizationAddressSparse],
    );
  }
  return cleanedAddress;
};

export const isEmptyAddress = (address: OrganizationAddressSparse) => {
  for (const value of Object.values(address)) {
    if (value && value.trim().length > 0) {
      return false; // At least one field is not empty
    }
  }
  return true; // All fields are empty
};
