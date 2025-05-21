import { OrganizationSparse } from "./data";

const decomposeFilterValue = (filterValue: string) => {
  let filterType = filterValue.substring(0, 2);
  if (filterType === "==" || filterType === ">=" || filterType === "<=") {
    const numberValue = parseFloat(filterValue.substring(2));
    return isNaN(numberValue) ? undefined : {
      filterType,
      numberValue,
    };
  }
  filterType = filterValue.substring(0, 1);
  if (filterType === "=" || filterType === ">" || filterType === "<") {
    const numberValue = parseFloat(filterValue.substring(1));
    return isNaN(numberValue) ? undefined : {
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
        organizations = organizations.filter(org => {
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

    organizations = organizations.filter(org =>
      org[key as keyof Omit<OrganizationSparse, "id">].toLowerCase().includes(value)
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
        organizations.sort((a, b) => value === "asc" ?
          a[key].localeCompare(b[key]) :
          b[key].localeCompare(a[key]));
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
}