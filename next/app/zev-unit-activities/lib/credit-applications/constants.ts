import {
  CreditApplicationStatus,
  CreditApplicationSupplierStatus,
  VehicleClass,
  ZevClass,
  ZevType,
} from "@/prisma/generated/enums";
import {
  CreditApplicationModel,
  CreditApplicationRecordModel,
} from "@/prisma/generated/models";
import Decimal from "decimal.js";
import Excel from "exceljs";

export const zevsListSheetName = "ZEVs List";

export const zevsListSheetNumberOfRows = 2001;

export enum SupplierTemplate {
  Name = "credit_application_supplier_template.xlsx",
  ValidVehiclesSheetName = "Valid Vehicles",
  ZEVsListSheetName = zevsListSheetName,
  ZEVsListSheetNumberOfRows = zevsListSheetNumberOfRows,
}

export enum SupplierSubTemplate {
  Name = "credit_application_supplier_sub_template.xlsx",
  ZEVsListSheetName = zevsListSheetName,
  ZEVsListSheetNumberOfRows = zevsListSheetNumberOfRows,
}

export enum ErrorsTemplate {
  Name = "vin_errors_template.xlsx",
  ErrorsSheetName = "VIN Errors",
}

export const mapOfStatusToSupplierStatus: Readonly<
  Record<CreditApplicationStatus, CreditApplicationSupplierStatus>
> = {
  [CreditApplicationStatus.DRAFT]: CreditApplicationStatus.DRAFT,
  [CreditApplicationStatus.ISSUED]: CreditApplicationSupplierStatus.ISSUED,
  [CreditApplicationStatus.RECOMMENDED]:
    CreditApplicationSupplierStatus.SUBMITTED,
  [CreditApplicationStatus.RETURNED_TO_ANALYST]:
    CreditApplicationSupplierStatus.SUBMITTED,
  [CreditApplicationStatus.REJECTED]: CreditApplicationSupplierStatus.REJECTED,
  [CreditApplicationStatus.SUBMITTED]:
    CreditApplicationSupplierStatus.SUBMITTED,
  [CreditApplicationStatus.VALIDATED]:
    CreditApplicationSupplierStatus.SUBMITTED,
};

export const supplierVisibleHistoryActions = Object.values(
  CreditApplicationSupplierStatus,
);

export type CreditApplicationSparse = Pick<
  CreditApplicationModel,
  | "id"
  | "status"
  | "submissionTimestamp"
  | "supplierStatus"
  | "transactionTimestamps"
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
  | "transactionTimestamps"
  | "aCredits"
  | "bCredits"
> & {
  organization: string;
  submissionTimestamp?: string;
  transactionTimestamps: string[];
  aCredits?: string;
  bCredits?: string;
};

export type CreditApplicationRecordSparse = Omit<
  CreditApplicationRecordModel,
  "vehicleClass" | "zevClass" | "legacyNumberOfUnits" | "numberOfUnits"
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

export const warningDescriptions: Readonly<Record<string, string>> = {
  "1": "VIN not found in ICBC records",
  "2": "Make does not match ICBC records",
  "3": "Model year does not match ICBC records",
  "4": "No registration date",
};

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

export type GovCaStatRecord = {
  vehicleClass: string;
  zevClass: string;
  modelYear: string;
  make: string;
  modelName: string;
  zevType: string;
  range: string;
  legacyNumberOfUnits: string;
  numberOfUnits: string;
  vinsCount: number;
  validVinsCount: number;
  creditsSum: Decimal;
  validCreditsSum: Decimal;
};

export type GovCaStatRecordSerialized = Omit<
  GovCaStatRecord,
  "creditsSum" | "validCreditsSum"
> & {
  creditsSum: string;
  validCreditsSum: string;
};

export type GovCaStatRecordSerializedWithId = GovCaStatRecordSerialized & {
  id: number;
};

export type CaHistorySparse = {
  userAction: CreditApplicationStatus;
  timestamp: Date;
  user: { firstName: string; lastName: string };
};

export type ZevVinRecord = {
  make: string;
  modelName: string;
  modelYear: string;
  vin: string;
  date: string;
  vehicleClass: VehicleClass;
  zevClass: ZevClass;
  legacyNumberOfUnits: string;
  numberOfUnits: string;
  zevType: ZevType;
  range: number;
  errors: string[];
};

export type ZevVinRecordSparse = {
  make: string;
  modelName: string;
  modelYear: string;
  vin: string;
  date: string;
  errors: string[];
};

export type ZevModelsMap = Partial<
  Record<
    string,
    {
      id: number;
      vehicleClass: VehicleClass;
      zevClass: ZevClass;
      legacyNumberOfUnits: string;
      numberOfUnits: string;
      zevType: ZevType;
      range: number;
    }
  >
>;

export type CaDataFinal =
  CaDataEligibleIneligible | CaDataEligible | CaDataIneligible | CaDataNone;

type CaDataEligibleIneligible = {
  type: "eligibleIneligible";
  eligibleWorkbook: Excel.Workbook;
  eligibleCount: number;
  ineligibleWorkbook: Excel.Workbook;
  ineligibleCount: number;
};

type CaDataEligible = {
  type: "eligible";
  payload: Partial<ZevVinRecord>[];
};

type CaDataIneligible = {
  type: "ineligible";
  ineligibleWorkbook: Excel.Workbook;
  ineligibleCount: number;
};

type CaDataNone = {
  type: "none";
};

export const impermissableCaSubmissionMsg = "IMPERMISSABLE_CA";

export class ImpermissableCaSubmission extends Error {
  constructor() {
    super(impermissableCaSubmissionMsg);
  }
}

export const caRecordKeyDelimiter = "|";

export const section14Date = new Date("2026-10-01T00:00:00.000");
