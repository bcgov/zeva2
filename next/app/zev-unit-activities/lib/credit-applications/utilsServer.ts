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
  CreditApplicationRecordSparse,
  CreditApplicationRecordSparseSerialized,
  CreditApplicationSparse,
  CreditApplicationSparseSerialized,
} from "./constants";
import { IcbcRecordsMap } from "./services";
import { CreditApplicationCredit } from "./data";
import { getIsoYmdString, validateDate } from "@/app/lib/utils/date";

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
    } else if (
      key === "submissionTimestamp" ||
      key === "transactionTimestamp"
    ) {
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
        key === "transactionTimestamp" ||
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
  records.forEach((record) => {
    const resultRecord: CreditApplicationSparseSerialized = {
      id: record.id,
      organization: record.organization.name,
      status: userIsGov ? record.status : record.supplierStatus,
      submissionTimestamp: record.submissionTimestamp
        ? getIsoYmdString(record.submissionTimestamp)
        : undefined,
      transactionTimestamp: record.transactionTimestamp
        ? getIsoYmdString(record.transactionTimestamp)
        : undefined,
      modelYears: record.modelYears,
      eligibleVinsCount: record.eligibleVinsCount,
      ineligibleVinsCount: record.ineligibleVinsCount,
      aCredits: record.aCredits?.toFixed(2),
      bCredits: record.bCredits?.toFixed(2),
    };
    result.push(resultRecord);
  });
  return result;
};

export const getWarningsMap = (
  records: {
    vin: string;
    make: string;
    modelName: string;
    modelYear: ModelYear;
  }[],
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
