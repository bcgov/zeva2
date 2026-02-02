import { ModelYear, ZevClass } from "@/prisma/generated/client";

export enum MyrTemplate {
  Name = "model_year_report_template.xlsx",
  DetailsSheetName = "Details",
  SupplierDetailsSheetName = "Supplier Details",
  VehicleStatisticsSheetName = "Vehicle Statistics",
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
  Supplementary = "supplementary",
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

export enum IsCompliant {
  Yes = "Yes",
  No = "No",
}

export const legacyModelYearsMap: Readonly<Partial<Record<string, ModelYear>>> =
  {
    "2019": ModelYear.MY_2019,
    "2020": ModelYear.MY_2020,
    "2021": ModelYear.MY_2021,
    "2022": ModelYear.MY_2022,
    "2023": ModelYear.MY_2023,
    "2024": ModelYear.MY_2024,
  };

export const interiorVolumes: readonly string[] = [
  "Two-seater",
  "Minicompact (less than 85 cu. ft.)",
  "Subcompact (85–99 cu. ft.)",
  "Compact (100–109 cu. ft.)",
  "Mid-size (110–119 cu. ft.)",
  "Full-size (120 cu. ft. or more)",
  "Station wagon: Small (less than 130 cu. ft.)",
  "Station wagon: Mid-size (130–159 cu. ft.)",
  "Pickup truck: Small (less than 2722 kg)",
  "Pickup truck: Standard (2722–3856 kg)",
  "Sport utility vehicle: Small (less than 2722 kg)",
  "Sport utility vehicle: Standard (2722–4536 kg)",
  "Minivan (less than 3856 kg)",
  "Van: Cargo (less than 3856 kg)",
  "Van: Passenger (less than 4536 kg)",
  "Special purpose vehicle (less than 3856 kg)",
  "Other/TBD",
];
