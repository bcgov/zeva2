import { ModelYear } from "@/prisma/generated/client";
import {
  getModelYearEnumsToStringsMap,
  getStringsToModelYearsEnumsMap,
} from "./enumMaps";

// please only use these functions server-side, where the TZ is set to "America/Vancouver"

export const getCurrentComplianceYear = () => {
  const now = new Date();
  const month = now.getMonth();
  let year = now.getFullYear();
  if (month < 9) {
    year = year - 1;
  }
  const modelYearsMap = getStringsToModelYearsEnumsMap();
  const modelYear = modelYearsMap[year.toString()];
  if (!modelYear) {
    throw new Error("Error getting current compliance year!");
  }
  return modelYear;
};

export const getAdjacentYear = (
  type: "prev" | "next",
  modelYear: ModelYear,
) => {
  const modelYears = Object.values(ModelYear);
  const numOfModelYears = modelYears.length;
  const modelYearIndex = modelYears.indexOf(modelYear);
  const prevIndex = modelYearIndex - 1;
  const nextIndex = modelYearIndex + 1;
  if (type === "prev" && prevIndex > -1 && prevIndex < numOfModelYears - 1) {
    return modelYears[prevIndex];
  }
  if (type === "next" && nextIndex > 0 && nextIndex < numOfModelYears) {
    return modelYears[nextIndex];
  }
  throw new Error("Error getting adjacent year!");
};

export const getCompliancePeriod = (complianceYear: ModelYear) => {
  const modelYearsMap = getModelYearEnumsToStringsMap();
  const lowerYear = modelYearsMap[complianceYear];
  const upperYear = modelYearsMap[getAdjacentYear("next", complianceYear)];
  return {
    closedLowerBound: new Date(`${lowerYear}-10-01T00:00:00`),
    openUpperBound: new Date(`${upperYear}-10-01T00:00:00`),
  };
};

export const getModelYearReportModelYear = () => {
  const modelYearsMap = getStringsToModelYearsEnumsMap();
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const date = now.getDate();
  if (month === 9 && date >= 1 && date <= 20) {
    return modelYearsMap[year - 1];
  } else if (month >= 9) {
    return modelYearsMap[year];
  } else if (month < 9) {
    return modelYearsMap[year - 1];
  }
};

export const getComplianceDate = (modelYear: ModelYear): Date => {
  const modelYearsMap = getModelYearEnumsToStringsMap();
  const year = getAdjacentYear("next", modelYear);
  return new Date(`${modelYearsMap[year]}-09-30T23:59:59`);
};
