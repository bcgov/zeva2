import {
  CreditApplicationStatus,
  CreditApplicationSupplierStatus,
} from "@/prisma/generated/client";

export enum CreditApplicationSubDirectory {
  CreditApplications = "creditApplication",
}

export enum SupplierTemplate {
  Name = "credit_application_supplier_template.xlsx",
  ValidVehiclesSheetName = "Valid Vehicles",
  ZEVsSuppliedSheetName = "ZEVs Supplied",
}

export enum SupplierTemplateVehiclesSheetData {
  HeaderIndex = 1,
}

export enum SupplierTemplateVehiclesSheetHeaderNames {
  Make = "Make",
  ModelName = "Model Name",
  ModelYear = "Model Year",
}

export enum SupplierTemplateZEVsSuppliedSheetData {
  HeaderIndex = 1,
  MaxNumberOfRecords = 2000,
}

export enum SupplierTemplateZEVsSuppliedSheetHeaderNames {
  VIN = "VIN",
  Make = "Make",
  ModelName = "Model Name",
  ModelYear = "Model Year",
  Date = "Date (YYYY-MM-DD)",
}

export const mapOfStatusToSupplierStatus: Readonly<
  Record<CreditApplicationStatus, CreditApplicationSupplierStatus>
> = {
  [CreditApplicationStatus.APPROVED]: CreditApplicationSupplierStatus.APPROVED,
  [CreditApplicationStatus.RECOMMEND_APPROVAL]:
    CreditApplicationSupplierStatus.SUBMITTED,
  [CreditApplicationStatus.RECOMMEND_REJECTION]:
    CreditApplicationSupplierStatus.SUBMITTED,
  [CreditApplicationStatus.REJECTED]: CreditApplicationSupplierStatus.REJECTED,
  [CreditApplicationStatus.RETURNED_TO_ANALYST]:
    CreditApplicationSupplierStatus.SUBMITTED,
  [CreditApplicationStatus.RETURNED_TO_SUPPLIER]:
    CreditApplicationSupplierStatus.RETURNED_TO_SUPPLIER,
  [CreditApplicationStatus.SUBMITTED]:
    CreditApplicationSupplierStatus.SUBMITTED,
};
