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

export const getCompliancePeriod = (complianceYear: number) => {
  const upperBoundYear = complianceYear + 1;
  const isoStringSuffix = "-10-01T7:00:00.000Z";
  return {
    closedLowerBound: new Date(complianceYear + isoStringSuffix),
    openUpperBound: new Date(upperBoundYear + isoStringSuffix),
  };
};
