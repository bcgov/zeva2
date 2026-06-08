import {
  CreditApplicationStatus,
  CreditApplicationSupplierStatus,
} from "@/prisma/generated/enums";
import {
  CreditApplicationModel,
  CreditApplicationRecordModel,
} from "@/prisma/generated/models";

export enum SupplierTemplate {
  Name = "credit_application_supplier_template.xlsx",
  ValidVehiclesSheetName = "Valid Vehicles",
  ZEVsSuppliedSheetName = "ZEVs Supplied",
  ZEVsSuppliedSheetNumberOfRows = 2001,
}

export enum ErrorsTemplate {
  Name = "vin_errors_template.xlsx",
  ErrorsSheetName = "VIN Errors",
}

export const mapOfStatusToSupplierStatus: Readonly<
  Record<CreditApplicationStatus, CreditApplicationSupplierStatus>
> = {
  [CreditApplicationStatus.APPROVED]: CreditApplicationSupplierStatus.APPROVED,
  [CreditApplicationStatus.DRAFT]: CreditApplicationStatus.DRAFT,
  [CreditApplicationStatus.RECOMMEND_APPROVAL]:
    CreditApplicationSupplierStatus.SUBMITTED,
  [CreditApplicationStatus.RETURNED_TO_ANALYST]:
    CreditApplicationSupplierStatus.SUBMITTED,
  [CreditApplicationStatus.REJECTED]: CreditApplicationSupplierStatus.REJECTED,
  [CreditApplicationStatus.SUBMITTED]:
    CreditApplicationSupplierStatus.SUBMITTED,
};

export type CreditApplicationSparse = Pick<
  CreditApplicationModel,
  | "id"
  | "status"
  | "submissionTimestamp"
  | "supplierStatus"
  | "transactionTimestamp"
  | "modelYears"
  | "eligibleVinsCount"
  | "ineligibleVinsCount"
  | "aCredits"
  | "bCredits"
> & { organization: { name: string } };

export type CreditApplicationSparseSerialized = Omit<
  CreditApplicationSparse,
  | "submissionTimestamp"
  | "supplierStatus"
  | "organization"
  | "transactionTimestamp"
  | "aCredits"
  | "bCredits"
> & {
  organization: string;
  submissionTimestamp?: string;
  transactionTimestamp?: string;
  aCredits?: string;
  bCredits?: string;
};

export type CreditApplicationRecordSparse = Omit<
  CreditApplicationRecordModel,
  "vehicleClass" | "zevClass" | "numberOfUnits"
>;

export type CreditApplicationRecordSparseSerialized = Omit<
  CreditApplicationRecordSparse,
  "timestamp" | "icbcRegistrationTimestamp"
> & { timestamp: string; icbcRegistrationTimestamp: string | null };

export enum ValidReason {
  EvidenceProvided = "Evidence provided",
  OtherMeans = "Validated by other means as being registered in BC",
  IcbcError = "Error in ICBC data",
  Other = "Valid for another reason, explained in comments",
}

export enum InvalidReason {
  ModelYear = "Invalid Model Year",
  Other = "Invalid for another reason, explained in comments",
}

export const isValidReason = (s: string): s is ValidReason => {
  return Object.values(ValidReason).some((reason) => {
    return reason === s;
  });
};

export const isInvalidReason = (s: string): s is InvalidReason => {
  return Object.values(InvalidReason).some((reason) => {
    return reason === s;
  });
};
