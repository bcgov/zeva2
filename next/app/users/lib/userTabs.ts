import { UserActiveFilter } from "@/app/lib/constants/filter";
import { getString } from "@/lib/utils/urlSearchParams";
import { Idp } from "@/prisma/generated/client";

export type UserTabKey = "idir" | "bceid" | "inactive";

type UserTabConfig = {
  label: string;
  filters: Record<string, string>;
};

export const defaultUserTab: UserTabKey = "idir";

export const USER_TAB_CONFIG: Record<UserTabKey, UserTabConfig> = {
  idir: {
    label: "IDIR Users",
    filters: {
      [UserActiveFilter.key]: UserActiveFilter.activeValue,
      idp: Idp.AZURE_IDIR,
    },
  },
  bceid: {
    label: "BCEID Users",
    filters: {
      [UserActiveFilter.key]: UserActiveFilter.activeValue,
      idp: Idp.BCEID_BUSINESS,
    },
  },
  inactive: {
    label: "All Inactive Users",
    filters: {
      [UserActiveFilter.key]: UserActiveFilter.inactiveValue,
    },
  },
};

const removeTabFilterKeys = (
  filters: Record<string, string>,
  tab: UserTabKey,
) => {
  const sanitizedFilters = { ...filters };
  Object.keys(USER_TAB_CONFIG[tab].filters).forEach((key) => {
    delete sanitizedFilters[key];
  });
  return sanitizedFilters;
};

export const getUserTabFromParam = (
  tabParam: string | undefined,
): UserTabKey => {
  if (tabParam === "bceid" || tabParam === "inactive") {
    return tabParam;
  }
  return defaultUserTab;
};

export const applyUserTabFilters = (
  filters: Record<string, string>,
  tab: UserTabKey,
): Record<string, string> => {
  return {
    ...removeTabFilterKeys(filters, tab),
    ...USER_TAB_CONFIG[tab].filters,
  };
};

export const getFilterStringForUserTab = (
  filters: Record<string, string>,
  tab: UserTabKey,
): string => {
  const sanitizedFilters = { ...filters };
  delete sanitizedFilters[UserActiveFilter.key];
  delete sanitizedFilters["idp"];
  return getString(applyUserTabFilters(sanitizedFilters, tab));
};

export const getUserTypeLabel = (idp: Idp) =>
  idp === Idp.AZURE_IDIR ? "IDIR" : "BCEID";
