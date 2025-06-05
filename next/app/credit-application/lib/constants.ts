export enum CreditApplicationSubDirectory {
  CreditApplications = "creditApplication",
}

export enum SupplierTemplate {
  Name = "credit_application_supplier_template.xlsx",
  HeaderIndex = 1,
  FirstRowIndex = 2,
  FinalRowIndex = 2001,
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
