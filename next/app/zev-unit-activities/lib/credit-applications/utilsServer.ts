import Excel from "exceljs";
import { ModelYear } from "@/prisma/generated/enums";
import {
  CreditApplicationWhereInput,
  CreditApplicationOrderByWithRelationInput,
  CreditApplicationRecordWhereInput,
  CreditApplicationRecordOrderByWithRelationInput,
} from "@/prisma/generated/models";
import {
  getMatchingTerms,
  getModelYearEnumsToStringsMap,
  getStringsToCreditApplicationStatusEnumsMap,
  getStringsToCreditApplicationSupplierStatusEnumsMap,
  getStringsToModelYearsEnumsMap,
} from "@/app/lib/utils/enumMaps";
import {
  CreditApplicationRecordSparse,
  CreditApplicationRecordSparseSerialized,
  CreditApplicationSparse,
  CreditApplicationSparseSerialized,
  SupplierTemplate,
} from "./constants";
import { IcbcRecordsMap } from "./services";
import { CreditApplicationCredit } from "./data";
import { getIsoYmdString, validateDate } from "@/app/lib/utils/date";
import {
  getAdjacentYear,
  getComplianceDate,
  getCurrentComplianceYear,
  getDominatedComplianceYears,
  withinTwentyDayPeriod,
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
  defaultSortById: boolean,
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
  if (defaultSortById && result.length === 0) {
    result.push({ id: "desc" });
  }
  return result;
};

export const getRecordsWhereClause = (
  filters: Record<string, string>,
): CreditApplicationRecordWhereInput => {
  const result: CreditApplicationRecordWhereInput = {};
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
    } else if (
      key === "modelYear" ||
      key === "icbcModelYear" ||
      key === "decodedModelYear"
    ) {
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
      key === "icbcModelName" ||
      key === "decodedMake" ||
      key === "decodedModelName"
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
): CreditApplicationRecordOrderByWithRelationInput[] => {
  const result: CreditApplicationRecordOrderByWithRelationInput[] = [];
  Object.entries(sorts).forEach(([key, value]) => {
    const orderBy: CreditApplicationRecordOrderByWithRelationInput = {};
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
        key === "decodedMake" ||
        key === "decodedModelName" ||
        key === "decodedModelYear" ||
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

export const getComplianceYearData = (submissionTimestamp: Date) => {
  const modelYearsMap = getModelYearEnumsToStringsMap();
  const currentCy = getCurrentComplianceYear();
  const complianceYears = Object.values(ModelYear)
    .filter((cy) => {
      return cy >= ModelYear.MY_2019 && cy <= currentCy;
    })
    .map((cy) => {
      const cyString = modelYearsMap[cy];
      if (!cyString) {
        throw new Error();
      }
      return cyString;
    });
  let defaultCy;
  if (withinTwentyDayPeriod(submissionTimestamp)) {
    defaultCy = getAdjacentYear("prev", currentCy);
  } else {
    defaultCy = currentCy;
  }
  const defaultCyString = modelYearsMap[defaultCy];
  if (!defaultCyString) {
    throw new Error();
  }
  return {
    complianceYears,
    defaultComplianceYear: defaultCyString,
  };
};

export const twentyDayPeriodCheck = (
  records: { modelYear: ModelYear; timestamp: Date }[],
) => {
  if (withinTwentyDayPeriod(new Date())) {
    const currentCy = getCurrentComplianceYear();
    const permittedCy = getAdjacentYear("prev", currentCy);
    const complianceDate = getComplianceDate(permittedCy);
    for (const record of records) {
      const modelYear = record.modelYear;
      const timestamp = record.timestamp;
      if (modelYear !== permittedCy) {
        throw new Error(
          `During the first 20 days of a compliance year, only VINs associated with the previous compliance year may be submitted!`,
        );
      }
      if (timestamp > complianceDate) {
        throw new Error(
          `During the first 20 days of a compliance year, only VINs with a date on or before the previous compliance date may be submitted!`,
        );
      }
    }
  }
};
