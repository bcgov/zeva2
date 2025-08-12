import {
  ModelYear,
  Prisma,
  TransactionType,
  VehicleClass,
  ZevClass,
} from "@/prisma/generated/client";
import { AdjustmentPayload, NvValues } from "./actions";
import {
  specialComplianceRatios,
  SupplierClass,
  unspecifiedComplianceRatios,
} from "@/app/lib/constants/complianceRatio";
import {
  applyTransfersAway,
  getSpecialZevClassPairs,
  UnexpectedDebit,
  ZevUnitRecord,
} from "@/lib/utils/zevUnit";
import { Decimal } from "@/prisma/generated/client/runtime/library";
import { ReportSubDirectory } from "./constants";
import { penaltyRates } from "@/app/lib/constants/penaltyRate";
import { isVehicleClass, isZevClass } from "@/app/lib/utils/typeGuards";

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
      if (isVehicleClass(vehicleClass)) {
        result.push(
          getReduction("0", nv, vehicleClass, ZevClass.UNSPECIFIED, modelYear),
        );
      }
    });
    return result;
  }
  Object.entries(nvValues).forEach(([vehicleClass, nv]) => {
    if (isVehicleClass(vehicleClass)) {
      const unspecifiedRatio =
        unspecifiedComplianceRatios[vehicleClass]?.[modelYear];
      if (!unspecifiedRatio) {
        throw new Error("Unspecified Compliance Ratio not found!");
      }
      const unspecifiedReduction = getReduction(
        unspecifiedRatio,
        nv,
        vehicleClass,
        ZevClass.UNSPECIFIED,
        modelYear,
      );
      if (
        supplierClass === "large volume supplier" ||
        (supplierClass === "medium volume supplier" &&
          modelYear >= ModelYear.MY_2026)
      ) {
        const specialReductions: ComplianceReduction[] = [];
        Object.entries(specialComplianceRatios).forEach(
          ([specialVehicleClass, subMap]) => {
            if (vehicleClass === specialVehicleClass) {
              Object.entries(subMap).forEach(([specialZevClass, subSubMap]) => {
                if (isZevClass(specialZevClass)) {
                  const specialRatio = subSubMap[modelYear];
                  if (specialRatio) {
                    const specialReduction = getReduction(
                      specialRatio,
                      nv,
                      specialVehicleClass,
                      specialZevClass,
                      modelYear,
                    );
                    unspecifiedReduction.numberOfUnits =
                      unspecifiedReduction.numberOfUnits.minus(
                        specialReduction.numberOfUnits,
                      );
                    specialReductions.push(specialReduction);
                  }
                }
              });
            }
          },
        );
        result.push(...specialReductions, unspecifiedReduction);
      } else {
        result.push(unspecifiedReduction);
      }
    }
  });
  return result;
};

export const getTransformedAdjustments = (
  adjustments: AdjustmentPayload[],
): ZevUnitRecord[] => {
  return adjustments.map((adjustment) => {
    return {
      ...adjustment,
      numberOfUnits: new Decimal(adjustment.numberOfUnits),
    };
  });
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

export const getReportFullObjectName = (
  orgId: number,
  myrOrForecast: "myr" | "forecast",
  objectName: string,
): string => {
  switch (myrOrForecast) {
    case "myr":
      return `${orgId}/${ReportSubDirectory.ModelYearReport}/${objectName}`;
    case "forecast":
      return `${orgId}/${ReportSubDirectory.Forecast}/${objectName}`;
  }
};

export type ComplianceInfo = {
  isCompliant: boolean;
  penalty: string;
};

export const getComplianceInfo = (
  supplierClass: SupplierClass,
  modelYear: ModelYear,
  prevEndingBalance: ZevUnitRecord[],
  endingBalance: ZevUnitRecord[],
): ComplianceInfo => {
  const result: ComplianceInfo = {
    isCompliant: true,
    penalty: "0",
  };
  const specialZevClassPairs = getSpecialZevClassPairs();
  let hasCredit = false;
  let hasDebit = false;
  let hasSpecialDebit = false;
  for (const record of endingBalance) {
    if (
      record.type === TransactionType.DEBIT &&
      !record.numberOfUnits.equals(0)
    ) {
      hasDebit = true;
      if (
        record.vehicleClass === VehicleClass.REPORTABLE &&
        specialZevClassPairs.some(
          ([pairVehicleClass, pairZevClass]) =>
            record.vehicleClass === pairVehicleClass &&
            record.zevClass === pairZevClass,
        )
      ) {
        hasSpecialDebit = true;
      }
    } else if (
      record.type === TransactionType.CREDIT &&
      !record.numberOfUnits.equals(0)
    ) {
      hasCredit = true;
    }
  }
  if (
    hasSpecialDebit &&
    (supplierClass === "large volume supplier" ||
      (supplierClass === "medium volume supplier" &&
        modelYear >= ModelYear.MY_2026))
  ) {
    result.isCompliant = false;
    result.penalty = getPenalty(modelYear, prevEndingBalance, endingBalance);
  } else if (supplierClass !== "small volume supplier") {
    if (hasDebit && !hasCredit) {
      result.isCompliant = false;
      result.penalty = getPenalty(modelYear, prevEndingBalance, endingBalance);
    } else if (hasDebit && hasCredit) {
      throw new Error("Cannot determine compliance with section 10(2)!");
    }
  }
  return result;
};

export const getPenalty = (
  modelYear: ModelYear,
  prevBalance: ZevUnitRecord[],
  currentBalance: ZevUnitRecord[],
): string => {
  let penalty: Decimal = new Decimal(0);
  const prevDebitVehicleClasses = new Set<VehicleClass>();
  const penaltyRate = penaltyRates[modelYear];
  prevBalance.forEach((record) => {
    if (
      record.type === TransactionType.DEBIT &&
      !record.numberOfUnits.equals(0)
    ) {
      prevDebitVehicleClasses.add(record.vehicleClass);
    }
  });
  if (prevDebitVehicleClasses.size === 0) {
    return "0";
  }
  currentBalance.forEach((record) => {
    if (
      record.type === TransactionType.DEBIT &&
      !record.numberOfUnits.equals(0) &&
      prevDebitVehicleClasses.has(record.vehicleClass)
    ) {
      if (penaltyRate) {
        penalty = penalty.plus(record.numberOfUnits.times(penaltyRate));
      } else {
        throw new Error("Penalty rate not found!");
      }
    }
  });
  return penalty.toFixed(2);
};
