export const MY_ORGANIZATION = "mine";

export enum Routes {
  Home = "/dashboard",
  CreditAgreements = "/zev-unit-activities/credit-agreements",
  CreditApplications = "/zev-unit-activities/credit-applications",
  CreditTransfers = "/zev-unit-activities/credit-transfers",
  PenaltyCredits = "/zev-unit-activities/penalty-credits",
  ZevUnitTransactions = "/zev-unit-activities/zev-unit-transactions",

  ComplianceReporting = "/model-year-report",
  ComplianceRatios = "/model-year-report/compliance-ratios",
  ComplianceCalculator = "/compliance-calculator",
  LegacyReassessments = "/legacy-reassessment",
  LegacySupplementary = "/legacy-supplementary",
  
  VehicleSuppliers = "/organizations",
  Administration = `/organizations/${MY_ORGANIZATION}`,
  Vehicle = "/vehicle",
  Users = "/users",
}
