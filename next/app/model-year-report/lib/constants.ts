import { ModelYear, ZevClass } from "@/prisma/generated/client";

export enum MyrTemplate {
  Name = "model_year_report_template.xlsx",
  DetailsSheetName = "Details",
  SupplierDetailsSheetName = "Supplier Details",
  VehiclesSuppliedSheetName = "Section 17(4)",
  ComplianceReductionsSheetName = "Compliance Ratio Reductions",
  BeginningBalanceSheetName = "Beginning Balance",
  CreditsSheetName = "Credits",
  OffsetsAndTransfersAwaySheetName = "Offsets and Transfers Away",
  PreliminaryEndingBalance = "Preliminary Ending Balance",
}

export enum ForecastTemplate {
  Name = "forecast_report_template.xlsx",
  ZevForecastSheetName = "ZEV Forecast",
  NonZevForecastSheetName = "Non-ZEV Forecast",
}

export enum AssessmentTemplate {
  Name = "assessment_template.xlsx",
  DetailsSheetName = "Details",
  ComplianceReductionsSheetName = "Compliance Ratio Reductions",
  BeginningBalanceSheetName = "Beginning Balance",
  CreditsSheetName = "Credits",
  PreviousAdjustmentsSheetName = "Previous Adjustments",
  CurrentAdjustmentsSheetName = "Current Adjustments",
  OffsetsAndTransfersAwaySheetName = "Offsets and Transfers Away",
  FinalEndingBalanceSheetName = "Final Ending Balance",
  StatementsSheetName = "Statement(s)",
}

export enum ReportSubDirectory {
  ModelYearReport = "modelYearReport",
  Forecast = "forecast",
  Assessment = "assessment",
  Reassessment = "reassessment",
}

export const supplierZevClasses = {
  [ZevClass.A]: ZevClass.A,
  [ZevClass.B]: ZevClass.B,
};

export type SupplierZevClassChoice =
  (typeof supplierZevClasses)[keyof typeof supplierZevClasses];

export const divisors: Readonly<Partial<Record<ModelYear, string>>> = {
  [ModelYear.MY_2025]: "3.5",
};
