import Excel from "exceljs";
import { ModelYear, Prisma } from "@/prisma/generated/client";
import {
  getMatchingTerms,
  getStringsToCreditApplicationStatusEnumsMap,
  getStringsToCreditApplicationSupplierStatusEnumsMap,
  getStringsToModelYearsEnumsMap,
} from "@/app/lib/utils/enumMaps";
import { SupplierTemplate } from "./constants";
import { IcbcRecordsMap } from "./services";
import {
  CreditApplicationCredit,
  CreditApplicationRecordSparse,
  CreditApplicationSparse,
} from "./data";
import { getIsoYmdString, validateDate } from "@/app/lib/utils/date";
import {
  getComplianceDate,
  getComplianceYear,
  getIsInReportingPeriod,
  getPreviousComplianceYear,
} from "@/app/lib/utils/complianceYear";

export const getWhereClause = (
  filters: Record<string, string>,
  userIsGov: boolean,
): Omit<Prisma.CreditApplicationWhereInput, "NOT"> => {
  const result: Omit<Prisma.CreditApplicationWhereInput, "NOT"> = {};
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
    }
  });
  return result;
};

export const getOrderByClause = (
  sorts: Record<string, string>,
  defaultSortById: boolean,
  userIsGov: boolean,
): Prisma.CreditApplicationOrderByWithRelationInput[] => {
  const result: Prisma.CreditApplicationOrderByWithRelationInput[] = [];
  for (const [key, value] of Object.entries(sorts)) {
    const orderBy: Prisma.CreditApplicationOrderByWithRelationInput = {};
    if (value === "asc" || value === "desc") {
      if (key === "id" || key === "submissionTimestamp") {
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
  if (defaultSortById && result.length === 0) {
    result.push({ id: "desc" });
  }
  return result;
};

export const getRecordsWhereClause = (
  filters: Record<string, string>,
): Prisma.CreditApplicationRecordWhereInput => {
  const result: Prisma.CreditApplicationRecordWhereInput = {};
  const modelYearsMap = getStringsToModelYearsEnumsMap();
  Object.entries(filters).forEach(([key, rawValue]) => {
    const value = rawValue.trim();
    if (key === "validated") {
      const newValue = value.toLowerCase();
      if (newValue === "y") {
        result[key] = true;
      } else if (newValue === "n") {
        result[key] = false;
      }
    } else if (key === "modelYear" || key === "icbcModelYear") {
      result[key] = {
        in: getMatchingTerms(modelYearsMap, value),
      };
    } else if (key === "timestamp") {
      const [isValidDate, date] = validateDate(value);
      if (isValidDate) {
        result[key] = date;
      } else {
        result.id = -1;
      }
    } else if (
      key === "vin" ||
      key === "make" ||
      key === "modelName" ||
      key === "icbcMake" ||
      key === "icbcModelName"
    ) {
      const newValue = value.toLowerCase();
      result[key] = {
        contains: newValue,
        mode: "insensitive",
      };
    } else if (key === "warnings") {
      let newValue: string | string[] = value.toLowerCase();
      if (newValue === "any") {
        result[key] = {
          isEmpty: false,
        };
      } else if (newValue === "none") {
        result[key] = {
          isEmpty: true,
        };
      } else {
        newValue = value.replaceAll(" ", "").split(",");
        result[key] = {
          hasSome: newValue,
        };
      }
    } else if (key === "reason") {
      let newValue: string = value.toLowerCase();
      if (newValue === "any") {
        result[key] = {
          not: null,
        };
      } else if (newValue === "none") {
        result[key] = null;
      } else {
        result[key] = {
          contains: newValue,
          mode: "insensitive",
        };
      }
    }
  });
  return result;
};

export const getRecordsOrderByClause = (
  sorts: Record<string, string>,
  defaultSortById: boolean,
): Prisma.CreditApplicationRecordOrderByWithRelationInput[] => {
  const result: Prisma.CreditApplicationRecordOrderByWithRelationInput[] = [];
  Object.entries(sorts).forEach(([key, value]) => {
    const orderBy: Prisma.CreditApplicationRecordOrderByWithRelationInput = {};
    if (
      (value === "asc" || value === "desc") &&
      (key === "vin" ||
        key === "timestamp" ||
        key === "make" ||
        key === "modelName" ||
        key === "modelYear" ||
        key === "icbcMake" ||
        key === "icbcModelName" ||
        key === "icbcModelYear" ||
        key === "validated" ||
        key === "warnings" ||
        key === "reason")
    ) {
      orderBy[key] = value;
    }
    if (Object.keys(orderBy).length > 0) {
      result.push(orderBy);
    }
  });
  if (defaultSortById && result.length === 0) {
    result.push({ id: "desc" });
  }
  return result;
};

export type CreditApplicationRecordSparseSerialized = Omit<
  CreditApplicationRecordSparse,
  "timestamp"
> & { timestamp: string };

export const getSerializedRecords = (
  records: CreditApplicationRecordSparse[],
) => {
  const result: CreditApplicationRecordSparseSerialized[] = [];
  records.forEach((record) => {
    result.push({
      ...record,
      timestamp: getIsoYmdString(record.timestamp),
    });
  });
  return result;
};

export type CreditApplicationSparseSerialized = Omit<
  CreditApplicationSparse,
  | "submissionTimestamp"
  | "supplierStatus"
  | "organization"
  | "transactionTimestamps"
> & {
  submissionTimestamp?: string;
  organization?: string;
  transactionTimestamps: string[];
};

export const getSerializedApplications = (
  records: CreditApplicationSparse[],
  userIsGov: boolean,
) => {
  const result: CreditApplicationSparseSerialized[] = [];
  records.forEach((record) => {
    const resultRecord: CreditApplicationSparseSerialized = {
      id: record.id,
      status: userIsGov ? record.status : record.supplierStatus,
      submissionTimestamp: record.submissionTimestamp
        ? getIsoYmdString(record.submissionTimestamp)
        : undefined,
      transactionTimestamps: record.transactionTimestamps.map((ts) => {
        return getIsoYmdString(ts);
      }),
      modelYears: record.modelYears,
    };
    if (userIsGov) {
      resultRecord.organization = record.organization.name;
    }
    result.push(resultRecord);
  });
  return result;
};

export const parseSupplierSubmission = (sheet: Excel.Worksheet) => {
  const data: Record<
    string,
    {
      make: string;
      modelName: string;
      modelYear: ModelYear;
      timestamp: Date;
    }
  > = {};
  const duplicateVins: Set<string> = new Set();
  const invalidRows: number[] = [];
  const modelYearsMap = getStringsToModelYearsEnumsMap();
  for (let i = 2; i <= SupplierTemplate.ZEVsSuppliedSheetNumberOfRows; i++) {
    const row = sheet.getRow(i);
    const make = row.getCell(1).value?.toString();
    const modelName = row.getCell(2).value?.toString();
    const modelYear = row.getCell(3).value?.toString();
    const vin = row.getCell(4).value?.toString();
    const date = row.getCell(5).value?.toString();
    if (!make && !modelName && !modelYear && !vin && !date) {
      continue;
    }
    if (vin && vin.length === 17 && make && modelName && modelYear && date) {
      if (data[vin]) {
        duplicateVins.add(vin);
        continue;
      }
      const modelYearEnum = modelYearsMap[modelYear];
      const [isValidDate, timestamp] = validateDate(date);
      if (
        modelYearEnum &&
        isValidDate &&
        timestamp >= new Date("2018-01-02T00:00:00")
      ) {
        data[vin] = {
          make,
          modelName,
          modelYear: modelYearEnum,
          timestamp,
        };
      } else {
        invalidRows.push(i);
      }
    } else {
      invalidRows.push(i);
    }
  }
  if (duplicateVins.size > 0) {
    throw new Error(`Duplicate VINs: ${[...duplicateVins].join(", ")}`);
  }
  if (invalidRows.length > 0) {
    throw new Error(
      `Rows with missing or invalid data: ${invalidRows.join(", ")}. Please refer to the instructions sheet for guidance.`,
    );
  }
  const numberOfVins = Object.keys(data).length;
  if (numberOfVins === 0) {
    throw new Error("Submission must have at least one VIN!");
  }
  return data;
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

export const getTransactionTimestamp = (
  submissionTimestamp: Date,
  issuanceTimestamp: Date,
  modelYear: ModelYear,
) => {
  const submittedDuringReportingPeriod =
    getIsInReportingPeriod(submissionTimestamp);
  if (submittedDuringReportingPeriod) {
    const complianceYear = getPreviousComplianceYear(submissionTimestamp);
    return getComplianceDate(complianceYear);
  }
  const submissionComplianceYear = getComplianceYear(submissionTimestamp);
  const issuanceComplianceYear = getComplianceYear(issuanceTimestamp);
  if (
    submissionComplianceYear !== issuanceComplianceYear &&
    modelYear <= submissionComplianceYear
  ) {
    return getComplianceDate(submissionComplianceYear);
  }
  return issuanceTimestamp;
};
