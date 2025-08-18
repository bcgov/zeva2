import { ModelYear, ZevClass } from "@/prisma/generated/client";

export enum MyrTemplate {
  Name = "model_year_report_template.xlsx",
  ModelYearSheetName = "Model Year",
  SupplierDetailsSheetName = "Section 17(3)",
  VehiclesSuppliedSheetName = "Section 17(4)",
  PrevBalanceSheetName = "Section 17(5)(a)",
  ComplianceReductionsSheetName = "Section 17(5)(b)",
  PriorityZevClassSheetName = "Priority ZEV Class",
  OffsetsAndTransfersAwaySheetName = "Section 17(5)(c)",
  CreditsSheetName = "Section 17(5)(d)",
}

export enum ForecastTemplate {
  Name = "forecast_report_template.xlsx",
}

export enum AssessmentTemplate {
  Name = "assessment_template.xlsx",
  DetailsSheetName = "Details",
  ComplianceReductionsSheetName = "Compliance Reductions",
  ComplianceStatementSheetName = "Section 19(1)(a)",
  EndingBalanceSheetName = "Section 19(1)(b)",
  OffsetsAndTransfersAwaySheetName = "Section 19(1)(c) - Part 1",
  CreditsSheetName = "Section 19(1)(c) - Part 2",
  AdjustmentsSheetName = "Section 19(1)(e)",
  PenaltySheetName = "Section 19(1)(f)",
}

export enum ReportSubDirectory {
  ModelYearReport = "modelYearReport",
  Forecast = "forecast",
  Assessment = "assessment",
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
