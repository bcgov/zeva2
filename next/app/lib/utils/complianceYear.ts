import { getStringsToModelYearsEnumsMap } from "./enumMaps";

// please only use server-side, since getMonth() and getFullYear() interpret timestamps as local times
export const getCurrentComplianceYear = () => {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  if (month >= 9) {
    return year;
  }
  return year - 1;
};

// please only use server-side, since, when the time zone offset is absent,
// date-time forms are interpreted as a local time.
export const getCompliancePeriod = (complianceYear: number) => {
  const upperBoundYear = complianceYear + 1;
  const isoStringSuffix = "-10-01T00:00:00.000";
  return {
    closedLowerBound: new Date(complianceYear + isoStringSuffix),
    openUpperBound: new Date(upperBoundYear + isoStringSuffix),
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
