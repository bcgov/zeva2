import {
  CreditApplicationStatus,
  CreditApplicationSupplierStatus,
} from "@/prisma/generated/client";

export enum SupplierTemplate {
  Name = "credit_application_supplier_template.xlsx",
  ValidVehiclesSheetName = "Valid Vehicles",
  ZEVsSuppliedSheetName = "ZEVs Supplied",
  ZEVsSuppliedSheetNumberOfRows = 2001,
}

export const mapOfStatusToSupplierStatus: Readonly<
  Record<CreditApplicationStatus, CreditApplicationSupplierStatus>
> = {
  [CreditApplicationStatus.APPROVED]: CreditApplicationSupplierStatus.APPROVED,
  [CreditApplicationStatus.DELETED]: CreditApplicationStatus.DELETED,
  [CreditApplicationStatus.DRAFT]: CreditApplicationStatus.DRAFT,
  [CreditApplicationStatus.RECOMMEND_APPROVAL]:
    CreditApplicationSupplierStatus.SUBMITTED,
  [CreditApplicationStatus.REJECTED]: CreditApplicationSupplierStatus.REJECTED,
  [CreditApplicationStatus.RETURNED_TO_ANALYST]:
    CreditApplicationSupplierStatus.SUBMITTED,
  [CreditApplicationStatus.SUBMITTED]:
    CreditApplicationSupplierStatus.SUBMITTED,
};
