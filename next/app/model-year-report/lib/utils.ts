import {
  ModelYear,
  Prisma,
  TransactionType,
  VehicleClass,
  ZevClass,
} from "@/prisma/generated/client";
import { NvValues } from "./actions";
import {
  complianceRatiosReportableA,
  complianceRatiosReportableUnspecified,
  SupplierClass,
} from "@/app/lib/constants/complianceRatio";
import {
  applyTransfersAway,
  UnexpectedDebit,
  ZevUnitRecord,
} from "@/lib/utils/zevUnit";
import { Decimal } from "@/prisma/generated/client/runtime/library";

export const validatePrevBalanceTransactions = (
  transactions: ZevUnitRecord[],
) => {
  transactions.forEach((transaction) => {
    if (transaction.type === TransactionType.DEBIT) {
      throw new UnexpectedDebit(
        "Unexpected debit when collecting previous balance!",
      );
    }
  });
  return applyTransfersAway(transactions);
};

export type ComplianceReduction = ZevUnitRecord & {
  complianceRatio: string;
  nv: string;
};

export const getReduction = (
  complianceRatio: string,
  nv: string,
  vehicleClass: VehicleClass,
  zevClass: ZevClass,
  modelYear: ModelYear,
): ComplianceReduction => {
  const product = new Decimal(complianceRatio).times(new Decimal(nv));
  const numberOfUnits = product.toDecimalPlaces(2);
  return {
    complianceRatio,
    nv,
    type: TransactionType.DEBIT,
    vehicleClass,
    zevClass,
    modelYear,
    numberOfUnits,
  };
};

export const getComplianceRatioReductions = (
  nvValues: NvValues,
  modelYear: ModelYear,
  supplierClass: SupplierClass,
): ComplianceReduction[] => {
  const result: ComplianceReduction[] = [];
  if (supplierClass === "small volume supplier") {
    Object.entries(nvValues).forEach(([vehicleClass, nv]) => {
      if (vehicleClass === VehicleClass.REPORTABLE) {
        result.push(
          getReduction(
            "0",
            nv,
            VehicleClass.REPORTABLE,
            ZevClass.UNSPECIFIED,
            modelYear,
          ),
        );
      }
    });
    return result;
  }
  const crReportableUnspecified =
    complianceRatiosReportableUnspecified[modelYear];
  const crReportableA = complianceRatiosReportableA[modelYear];
  if (!crReportableUnspecified || !crReportableA) {
    throw new Error("Cannot identify compliance ratio(s)!");
  }
  Object.entries(nvValues).forEach(([vehicleClass, nv]) => {
    if (vehicleClass === VehicleClass.REPORTABLE) {
      const classAReduction = getReduction(
        crReportableA,
        nv,
        vehicleClass,
        ZevClass.A,
        modelYear,
      );
      const unspecifiedReductionWithoutR = getReduction(
        crReportableUnspecified,
        nv,
        vehicleClass,
        ZevClass.UNSPECIFIED,
        modelYear,
      );
      const unspecifiedReductionWithR = {
        ...unspecifiedReductionWithoutR,
        numberOfUnits: unspecifiedReductionWithoutR.numberOfUnits.minus(
          classAReduction.numberOfUnits,
        ),
      };
      if (
        supplierClass === "large volume supplier" ||
        (supplierClass === "medium volume supplier" &&
          modelYear >= ModelYear.MY_2026)
      ) {
        result.push(classAReduction, unspecifiedReductionWithR);
      } else {
        result.push(unspecifiedReductionWithoutR);
      }
    }
  });
  return result;
};

export type UnitsAsString<T extends ZevUnitRecord> = Omit<
  T,
  "numberOfUnits"
> & { numberOfUnits: string };

export const getSerializedMyrRecords = <T extends ZevUnitRecord>(
  records: T[],
): UnitsAsString<T>[] => {
  return records.map((record) => {
    return {
      ...record,
      numberOfUnits: record.numberOfUnits.toString(),
    };
  });
};

export const getSerializedMyrRecordsExcludeKey = <
  T extends ZevUnitRecord,
  K extends keyof T,
>(
  records: T[],
  keyToExclude: K,
): Omit<UnitsAsString<T>, K>[] => {
  const serializedRecords = getSerializedMyrRecords<T>(records);
  return serializedRecords.map((record) => {
    const { [keyToExclude]: excludedKey, ...rest } = record;
    return rest;
  });
};

export const getZevUnitRecordsOrderByClause = (): [
  { type: Prisma.SortOrder },
  { vehicleClass: Prisma.SortOrder },
  { zevClass: Prisma.SortOrder },
  { modelYear: Prisma.SortOrder },
] => {
  return [
    { type: "asc" },
    {
      vehicleClass: "asc",
    },
    {
      zevClass: "asc",
    },
    {
      modelYear: "asc",
    },
  ];
};
