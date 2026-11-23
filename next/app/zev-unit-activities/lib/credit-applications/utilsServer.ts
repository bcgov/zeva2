import { CreditApplicationStatus, ModelYear } from "@/prisma/generated/enums";
import {
  CreditApplicationWhereInput,
  CreditApplicationOrderByWithRelationInput,
} from "@/prisma/generated/models";
import {
  getMatchingTerms,
  getStringsToCreditApplicationStatusEnumsMap,
  getStringsToCreditApplicationSupplierStatusEnumsMap,
  getStringsToModelYearsEnumsMap,
} from "@/app/lib/utils/enumMaps";
import {
  CaHistorySparse,
  caRecordKeyDelimiter,
  CreditApplicationRecordSparse,
  CreditApplicationRecordSparseSerialized,
  CreditApplicationSparse,
  CreditApplicationSparseSerialized,
  section14Date,
} from "./constants";
import { IcbcRecordsMap } from "./services";
import { CreditApplicationCredit } from "./data";
import { getIsoYmdString, validateDate } from "@/app/lib/utils/date";
import Decimal from "decimal.js";
import { checkCaRecordKey } from "./utils";
import {
  isModelYear,
  isVehicleClass,
  isZevClass,
} from "@/app/lib/utils/typeGuards";
import {
  getAdjacentYear,
  getComplianceDate,
  getCompliancePeriod,
} from "@/app/lib/utils/complianceYear";

export const getWhereClause = (
  filters: Record<string, string>,
  userIsGov: boolean,
): Omit<CreditApplicationWhereInput, "NOT"> => {
  const result: Omit<CreditApplicationWhereInput, "NOT"> = {};
  const statusMap = getStringsToCreditApplicationStatusEnumsMap();
  const supplierStatusMap =
    getStringsToCreditApplicationSupplierStatusEnumsMap();
  const modelYearsMap = getStringsToModelYearsEnumsMap();
  Object.entries(filters).forEach(([key, rawValue]) => {
    const value = rawValue.trim();
    if (key === "id") {
      result[key] = parseInt(value, 10);
    } else if (key === "status") {
      if (userIsGov) {
        result[key] = {
          in: getMatchingTerms(statusMap, value),
        };
      } else {
        result["supplierStatus"] = {
          in: getMatchingTerms(supplierStatusMap, value),
        };
      }
    } else if (key === "submissionTimestamp") {
      if ("--".includes(value)) {
        result[key] = null;
      } else {
        const [isValidDate, date] = validateDate(value);
        if (isValidDate) {
          const datePlusOneDay = new Date(date);
          datePlusOneDay.setDate(date.getDate() + 1);
          result.AND = [
            { [key]: { gte: date } },
            { [key]: { lt: datePlusOneDay } },
          ];
        } else {
          result.id = -1;
        }
      }
    } else if (key === "transactionTimestamps") {
      const [isValidDate, normalizedDate] = validateDate(value);
      if (isValidDate) {
        result[key] = {
          has: normalizedDate,
        };
      }
    } else if (key === "organization" && userIsGov) {
      result[key] = {
        is: {
          name: {
            contains: value,
            mode: "insensitive",
          },
        },
      };
    } else if (key === "modelYears") {
      result[key] = {
        hasSome: getMatchingTerms(modelYearsMap, value),
      };
    } else if (
      key === "eligibleVinsCount" ||
      key === "ineligibleVinsCount" ||
      key === "aCredits" ||
      key === "bCredits"
    ) {
      if ("--".includes(value)) {
        result[key] = null;
      } else {
        result[key] = value;
      }
    }
  });
  return result;
};

export const getOrderByClause = (
  sorts: Record<string, string>,
  userIsGov: boolean,
): CreditApplicationOrderByWithRelationInput[] => {
  const result: CreditApplicationOrderByWithRelationInput[] = [];
  for (const [key, value] of Object.entries(sorts)) {
    const orderBy: CreditApplicationOrderByWithRelationInput = {};
    if (value === "asc" || value === "desc") {
      if (
        key === "id" ||
        key === "submissionTimestamp" ||
        key === "eligibleVinsCount" ||
        key === "ineligibleVinsCount" ||
        key === "aCredits" ||
        key === "bCredits"
      ) {
        orderBy[key] = value;
      } else if (key === "status") {
        if (userIsGov) {
          orderBy[key] = value;
        } else {
          orderBy["supplierStatus"] = value;
        }
      } else if (key === "organization" && userIsGov) {
        orderBy[key] = {
          name: value,
        };
      }
    }
    if (Object.keys(orderBy).length > 0) {
      result.push(orderBy);
    }
  }
  return result;
};

export const getSerializedRecords = (
  records: CreditApplicationRecordSparse[],
) => {
  const result: CreditApplicationRecordSparseSerialized[] = [];
  for (const record of records) {
    result.push({
      ...record,
      timestamp: getIsoYmdString(record.timestamp),
      icbcRegistrationTimestamp: record.icbcRegistrationTimestamp
        ? getIsoYmdString(record.icbcRegistrationTimestamp)
        : null,
    });
  }
  return result;
};

export const getSerializedApplications = (
  records: CreditApplicationSparse[],
  userIsGov: boolean,
) => {
  const result: CreditApplicationSparseSerialized[] = [];
  for (const record of records) {
    const status = record.status;
    result.push({
      id: record.id,
      organization: record.organization.name,
      status: userIsGov ? record.status : record.supplierStatus,
      submissionTimestamp: record.submissionTimestamp
        ? getIsoYmdString(record.submissionTimestamp)
        : undefined,
      transactionTimestamps: record.transactionTimestamps.map((ts) =>
        getIsoYmdString(ts),
      ),
      modelYears: record.modelYears,
      eligibleVinsCount: userIsGov
        ? record.eligibleVinsCount
        : status === CreditApplicationStatus.ISSUED
          ? record.eligibleVinsCount
          : null,
      ineligibleVinsCount: userIsGov
        ? record.ineligibleVinsCount
        : status === CreditApplicationStatus.ISSUED
          ? record.ineligibleVinsCount
          : null,
      aCredits: userIsGov
        ? record.aCredits?.toFixed(2)
        : status === CreditApplicationStatus.ISSUED
          ? record.aCredits?.toFixed(2)
          : undefined,
      bCredits: userIsGov
        ? record.bCredits?.toFixed(2)
        : status === CreditApplicationStatus.ISSUED
          ? record.bCredits?.toFixed(2)
          : undefined,
    });
  }
  return result;
};

export const getWarningsMap = (
  records: {
    vin: string;
    make: string;
    modelName: string;
    modelYear: ModelYear;
  }[],
  complianceYear: ModelYear,
  icbcMap: IcbcRecordsMap,
) => {
  const result: Partial<Record<string, string[]>> = {};
  for (const record of records) {
    const vin = record.vin;
    const icbcRecord = icbcMap[record.vin];
    if (!icbcRecord) {
      result[vin] = ["1"];
      continue;
    }
    const warnings: string[] = [];
    if (icbcRecord.make !== record.make) {
      warnings.push("2");
    }
    if (icbcRecord.modelYear !== record.modelYear) {
      warnings.push("3");
    }
    if (complianceYear > ModelYear.MY_2023 && !icbcRecord.registrationDate) {
      warnings.push("4");
    }
    if (warnings.length > 0) {
      result[vin] = warnings;
    }
  }
  return result;
};

export const sumCredits = (credits: CreditApplicationCredit[]) => {
  const result: CreditApplicationCredit[] = [];
  credits.forEach((credit) => {
    const vehicleClass = credit.vehicleClass;
    const zevClass = credit.zevClass;
    const modelYear = credit.modelYear;
    const numberOfUnits = credit.numberOfUnits;
    const index = result.findIndex((result) => {
      return (
        result.vehicleClass === vehicleClass &&
        result.zevClass === zevClass &&
        result.modelYear === modelYear
      );
    });
    if (index > -1) {
      const credit = result[index];
      credit.numberOfUnits = credit.numberOfUnits.plus(numberOfUnits);
    } else {
      result.push({
        vehicleClass,
        zevClass,
        modelYear,
        numberOfUnits,
      });
    }
  });
  return result;
};

export type CreditApplicationCreditSerialized = Omit<
  CreditApplicationCredit,
  "numberOfUnits"
> & { numberOfUnits: string };

export const serializeCredits = (
  credits: CreditApplicationCredit[],
): CreditApplicationCreditSerialized[] => {
  return credits.map((credit) => {
    return { ...credit, numberOfUnits: credit.numberOfUnits.toString() };
  });
};

export const getMostRecentValidationData = (histories: CaHistorySparse[]) => {
  let latestValidation: CaHistorySparse | null = null;
  for (const history of histories) {
    if (
      history.userAction === CreditApplicationStatus.VALIDATED &&
      (!latestValidation || latestValidation.timestamp < history.timestamp)
    ) {
      latestValidation = history;
    }
  }
  return latestValidation;
};

export const getComplianceYearData = (complianceYear: ModelYear) => {
  return {
    complianceDate: getComplianceDate(complianceYear),
    dayAfterComplianceDate: getCompliancePeriod(complianceYear).openUpperBound,
  };
};

export const getCaRecordOnOrBeforeCd = (
  record: { modelYear: ModelYear; timestamp: Date },
  modelYearsMap: Partial<Record<ModelYear, string>>,
) => {
  const { modelYear, timestamp } = record;
  const year = getAdjacentYear("next", modelYear);
  const date = new Date(
    `${modelYearsMap[year]}-${process.env.END_OF_COMPLIANCE_YEAR}`,
  );
  if (timestamp <= date) {
    return true;
  }
  return false;
};

export const getCaRecordData = (
  complianceYear: ModelYear,
  complianceDate: Date,
  dayAfterComplianceDate: Date,
  registrationDate: Date | null,
  date: Date,
  legacyNumberOfUnits: Decimal,
  numberOfUnits: Decimal,
) => {
  if (complianceYear <= ModelYear.MY_2023) {
    return {
      transactionDate: getIsoYmdString(
        date < complianceDate ? date : complianceDate,
      ),
      numberOfUnitsToUse: legacyNumberOfUnits,
    };
  }
  let transactionDate;
  if (!registrationDate || registrationDate <= complianceDate) {
    if (date < complianceDate) {
      transactionDate = date;
    } else {
      transactionDate = complianceDate;
    }
  } else {
    if (date < dayAfterComplianceDate) {
      transactionDate = dayAfterComplianceDate;
    } else {
      transactionDate = date;
    }
  }
  let numberOfUnitsToUse;
  if (transactionDate < section14Date) {
    numberOfUnitsToUse = legacyNumberOfUnits;
  } else {
    numberOfUnitsToUse = numberOfUnits;
  }
  return {
    transactionDate: getIsoYmdString(transactionDate),
    numberOfUnitsToUse,
  };
};

// this function affects getTransctions!
export const getTransactionKey = (
  vehicleClass: string,
  zevClass: string,
  modelYear: string,
  date: string,
) => {
  const key = [vehicleClass, zevClass, modelYear, date].join(
    caRecordKeyDelimiter,
  );
  checkCaRecordKey(key, 3);
  return key;
};

// this function is affected by getTransactionKey!
export const getTransactionsAndTimestamps = (
  transactionsMap: Record<string, Decimal>,
) => {
  const transactions = [];
  const timestampsMap: Record<string, Date> = {};
  for (const [key, numberOfUnits] of Object.entries(transactionsMap)) {
    const fields = key.split(caRecordKeyDelimiter);
    const vehicleClass = fields[0];
    const zevClass = fields[1];
    const modelYear = fields[2];
    const date = fields[3];
    const [dateIsValid, normalizedDate] = validateDate(date);
    if (
      !isVehicleClass(vehicleClass) ||
      !isZevClass(zevClass) ||
      !isModelYear(modelYear) ||
      !dateIsValid
    ) {
      throw new Error("Unexpected Error!");
    }
    transactions.push({
      vehicleClass,
      zevClass,
      modelYear,
      numberOfUnits,
      timestamp: normalizedDate,
    });
    timestampsMap[date] = normalizedDate;
  }
  return {
    transactions,
    timestamps: Object.values(timestampsMap),
  };
};
