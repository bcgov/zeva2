import { getString } from "@/lib/utils/urlSearchParams";
import { UserActiveFilter, VehicleActiveFilter } from "../constants/filter";

export const getTransformedFilters = (
  type: "user" | "vehicle",
  filters: Record<string, string>,
): { filters: Record<string, string>; isActive: boolean } => {
  let activeFilter;
  switch (type) {
    case "user":
      activeFilter = UserActiveFilter;
      break;
    case "vehicle":
      activeFilter = VehicleActiveFilter;
      break;
  }
  if (
    filters[activeFilter.key]?.toLowerCase().trim() ===
    activeFilter.inactiveValue
  ) {
    return {
      filters,
      isActive: false,
    };
  }
  return {
    filters: { ...filters, [activeFilter.key]: activeFilter.activeValue },
    isActive: true,
  };
};

export const getFilterStringWithActiveFilter = (
  type: "user" | "vehicle",
  filters: Record<string, string>,
  isActive: boolean,
): string => {
  let activeFilter;
  switch (type) {
    case "user":
      activeFilter = UserActiveFilter;
      break;
    case "vehicle":
      activeFilter = VehicleActiveFilter;
      break;
  }
  const newFilters = {
    ...filters,
    [activeFilter.key]: isActive
      ? activeFilter.activeValue
      : activeFilter.inactiveValue,
  };
  return getString(newFilters);
};
