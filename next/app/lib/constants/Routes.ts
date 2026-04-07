export const MY_ORGANIZATION = "mine";

export enum Routes {
  Home = "/dashboard",

  // compliance reporting
  ComplianceCalculator = "/compliance-reporting/compliance-calculator",
  ComplianceRatios = "/compliance-reporting/compliance-ratios",
  LegacyReassessments = "/compliance-reporting/legacy-reassessments",
  LegacySupplementary = "/compliance-reporting/legacy-supplementarys",
  ModelYearReports = "/compliance-reporting/model-year-reports",

  // zev unit activities
  CreditAgreements = "/zev-unit-activities/credit-agreements",
  CreditApplications = "/zev-unit-activities/credit-applications",
  CreditTransfers = "/zev-unit-activities/credit-transfers",
  PenaltyCredits = "/zev-unit-activities/penalty-credits",
  ZevUnitTransactions = "/zev-unit-activities/zev-unit-transactions",
  
  VehicleSuppliers = "/organizations",
  Administration = `/organizations/${MY_ORGANIZATION}`,
  Vehicle = "/vehicle",
  Users = "/users",
}
