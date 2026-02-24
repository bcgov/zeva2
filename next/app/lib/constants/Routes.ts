export const MY_ORGANIZATION = "mine";

export enum Routes {
  Home = "/dashboard",
  ComplianceReporting = "/model-year-report",
  ComplianceRatios = "/model-year-report/compliance-ratios",
  ComplianceCalculator = "/compliance-calculator",
  LegacyReassessments = "/legacy-reassessment",
  LegacySupplementary = "/legacy-supplementary",
  CreditTransfers = "/credit-transfer",
  CreditAgreements = "/agreements",
  VehicleSuppliers = "/organizations",
  Administration = `/organizations/${MY_ORGANIZATION}`,
  Icbc = "/icbc",
  Vehicle = "/vehicle",
  Users = "/users",
  CreditApplication = "/credit-application",
  PenaltyCredit = "/penalty-credits",
  ZevUnitBalance = "/zev-unit-balance",
}
