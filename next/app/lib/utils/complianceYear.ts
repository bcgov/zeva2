import { ModelYear } from "@/prisma/generated/enums";
import {
  getModelYearEnumsToStringsMap,
  getStringsToModelYearsEnumsMap,
} from "./enumMaps";

// please, unless otherwise stated, only use these functions server-side, where the TZ is set to "America/Vancouver",
// and where certain env vars are defined.

export const getComplianceYear = (date: Date) => {
  let year = date.getFullYear();
  const complianceDate = new Date(
    `${year.toString()}-${process.env.BEGINNING_OF_COMPLIANCE_YEAR}`,
  );
  if (date < complianceDate) {
    year = year - 1;
  }
  const modelYearsMap = getStringsToModelYearsEnumsMap();
  const modelYear = modelYearsMap[year.toString()];
  if (!modelYear) {
    throw new Error("Error getting current compliance year!");
  }
  return modelYear;
};

export const getCurrentComplianceYear = () => {
  return getComplianceYear(new Date());
};

export const getPreviousComplianceYear = (date: Date) => {
  const nowYear = getComplianceYear(date);
  return getAdjacentYear("prev", nowYear);
};

// may be used client-side
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
    closedLowerBound: new Date(
      `${lowerYear}-${process.env.BEGINNING_OF_COMPLIANCE_YEAR}`,
    ),
    openUpperBound: new Date(
      `${upperYear}-${process.env.BEGINNING_OF_COMPLIANCE_YEAR}`,
    ),
  };
};

export const getComplianceDate = (modelYear: ModelYear): Date => {
  const modelYearsMap = getModelYearEnumsToStringsMap();
  const year = getAdjacentYear("next", modelYear);
  return new Date(
    `${modelYearsMap[year]}-${process.env.END_OF_COMPLIANCE_YEAR}`,
  );
};

// may be used client-side
export const getDominatedComplianceYears = (complianceYear: ModelYear) => {
  return Object.values(ModelYear).filter((cy) => cy < complianceYear);
};

export const within20DayPeriod = () => {
  const now = new Date();
  const nowMonth = now.getMonth();
  const nowDay = now.getDate();
  // any year will do
  const beginningOfCy = new Date(
    `2019-${process.env.BEGINNING_OF_COMPLIANCE_YEAR}`,
  );
  const beginningOfCyMonth = beginningOfCy.getMonth();
  const beginningOfCyDay = beginningOfCy.getDate();
  if (
    nowMonth === beginningOfCyMonth &&
    nowDay >= beginningOfCyDay &&
    nowDay <= beginningOfCyDay + 19
  ) {
    return true;
  }
  return false;
};
