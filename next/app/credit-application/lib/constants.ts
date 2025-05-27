export enum SheetStructure {
  HeaderIndex = 1,
  FirstRowIndex = 2,
  FinalRowIndex = 2001,
}

export enum Directory {
  Templates = "templates/",
  CreditApplication = "creditApplications/",
  CreditApplicationTmp = "creditApplications/tmp/",
}

export enum TemplateNames {
  SupplierTemplate = "credit_application_supplier_template.xlsx",
  GovTemplate = "credit_application_gov_template.xlsx",
}

export enum SupplierTemplateSheetNames {
  ValidVehicles = "Valid Vehicles",
  ZEVsSupplied = "ZEVs Supplied",
}

export enum SupplierTemplateZEVsSuppliedHeaderNames {
  VIN = "VIN",
  Make = "Make",
  ModelName = "Model Name",
  ModelYear = "Model Year",
  Date = "Date (YYYY-MM-DD)",
}

export enum GovTemplateSheetNames {
  ValidVins = "Valid VINs",
  CurableVins = "Curable Invalid VINs",
  IncurableVins = "Incurable Invalid VINs",
}

export enum GovTemplateValidVinsHeaderNames {
  VIN = "VIN",
  Make = "Make",
  ModelName = "Model Name",
  ModelYear = "Model Year",
  IcbcMake = "ICBC Make",
  IcbcModelName = "ICBC Model Name",
  IcbcModelYear = "ICBC Model Year",
  IcbcFileDate = "ICBC File Date",
  Date = "Date",
  VehicleClass = "Vehicle Class",
  ZevClass = "ZEV Class",
  NumberOfCredits = "Number of Credits",
  InvalidReason = "Invalid Reason",
  Comment = "Comment",
}

export enum GovTemplateCurableVinsHeaderNames {
  VIN = "VIN",
  Make = "Make",
  ModelName = "Model Name",
  ModelYear = "Model Year",
  IcbcMake = "ICBC Make",
  IcbcModelName = "ICBC Model Name",
  IcbcModelYear = "ICBC Model Year",
  IcbcFileDate = "ICBC File Date",
  Date = "Date",
  VehicleClass = "Vehicle Class",
  ZevClass = "ZEV Class",
  NumberOfCredits = "Number of Credits",
  Errors = "Errors",
  ValidReason = "Valid Reason",
  Comment = "Comment",
}

export const incurableErrors: readonly string[] = ["1"];

export const curableErrors: readonly string[] = ["11", "41"];
