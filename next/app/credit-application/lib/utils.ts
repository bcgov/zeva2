import Excel from "exceljs";
import {
  CreditApplicationStatus,
  CreditApplicationSupplierStatus,
  ModelYear,
  VehicleStatus,
  Prisma
} from "@/prisma/generated/client";
import { getStringsToModelYearsEnumsMap } from "@/app/lib/utils/enumMaps";
import {
  CreditApplicationSubDirectory,
  SupplierTemplateZEVsSuppliedSheetHeaderNames,
  SupplierTemplateZEVsSuppliedSheetData,
} from "./constants";
import { IcbcRecordsMap, VehicleSparse, VinRecordsMap } from "./services";
import {
  CreditApplicationCredit,
  CreditApplicationRecordSparse,
  CreditApplicationSparse,
} from "./data";
import { getIsoYmdString, validateDate } from "@/app/lib/utils/date";

export const getCreditApplicationFullObjectName = (
  userOrgId: number,
  objectName: string,
) => {
  return `${userOrgId}/${CreditApplicationSubDirectory.CreditApplications}/${objectName}`;
};

// make -> modelName -> modelYear -> id
export type VehiclesMapSparse = Record<
  string,
  Record<string, Partial<Record<ModelYear, number>>>
>;

export const getSupplierVehiclesMap = (vehicles: VehicleSparse[]) => {
  const result: VehiclesMapSparse = {};
  vehicles.forEach((vehicle) => {
    const make = vehicle.make;
    const modelName = vehicle.modelName;
    const modelYear = vehicle.modelYear;
    if (!result[make]) {
      result[make] = {};
    }
    if (!result[make][modelName]) {
      result[make][modelName] = {};
    }
    result[make][modelName][modelYear] = vehicle.id;
  });
  return result;
};

export const getWhereClause = (
  filters: Record<string, string>,
  userIsGov: boolean,
): Prisma.CreditApplicationWhereInput => {
  const result: Prisma.CreditApplicationWhereInput = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (key === "id") {
      result[key] = parseInt(value, 10);
    } else if (key === "status") {
      const newValue = value.replaceAll(" ", "").toLowerCase();
      const statuses = Object.values(CreditApplicationStatus);
      const matches = statuses.filter((status) => {
        const newStatus = status.replaceAll("_", "").toLowerCase();
        return newStatus.includes(newValue);
      });
      if (userIsGov) {
        result[key] = {
          in: matches,
        };
      } else {
        const supplierMatches = new Set(matches).intersection(
          new Set(Object.values(CreditApplicationSupplierStatus)),
        );
        result.supplierStatus = {
          in: Array.from(supplierMatches),
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
      const newValue = value.trim();
      result[key] = {
        is: {
          name: {
            contains: newValue,
            mode: "insensitive",
          },
        },
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
  Object.entries(sorts).forEach(([key, value]) => {
    if (value === "asc" || value === "desc") {
      if (key === "id" || key === "submissionTimestamp") {
        result.push({ [key]: value });
      } else if (key === "status") {
        if (userIsGov) {
          result.push({ status: value });
        } else {
          result.push({ supplierStatus: value });
        }
      } else if (key === "organization" && userIsGov) {
        result.push({
          [key]: {
            name: value,
          },
        });
      }
    }
  });
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
  Object.entries(filters).forEach(([key, value]) => {
    if (key === "validated") {
      const newValue = value.toLowerCase().trim();
      if (newValue === "y") {
        result[key] = true;
      } else if (newValue === "n") {
        result[key] = false;
      }
    } else if (key === "modelYear" || key === "icbcModelYear") {
      const modelYearEnums: ModelYear[] = [];
      const modelYearStrings = Object.keys(modelYearsMap);
      modelYearStrings.forEach((my) => {
        if (my.includes(value) && modelYearsMap[my]) {
          modelYearEnums.push(modelYearsMap[my]);
        }
      });
      result[key] = {
        in: modelYearEnums,
      };
    } else if (key === "timestamp" || key === "icbcTimestamp") {
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
      const newValue = value.trim().toLowerCase();
      result[key] = {
        contains: newValue,
        mode: "insensitive",
      };
    } else if (key === "warnings") {
      let newValue: string | string[] = value.toLowerCase().trim();
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
      let newValue: string = value.toLowerCase().trim();
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
    if (
      (value === "asc" || value === "desc") &&
      (key === "vin" ||
        key === "timestamp" ||
        key === "make" ||
        key === "modelName" ||
        key === "modelYear" ||
        key === "icbcTimestamp" ||
        key === "icbcMake" ||
        key === "icbcModelName" ||
        key === "icbcModelYear" ||
        key === "validated" ||
        key === "warnings" ||
        key === "reason")
    ) {
      result.push({ [key]: value });
    }
  });
  if (defaultSortById && result.length === 0) {
    result.push({ id: "desc" });
  }
  return result;
};

export type CreditApplicationRecordSparseSerialized = Omit<
  CreditApplicationRecordSparse,
  "timestamp" | "icbcTimestamp"
> & { timestamp: string; icbcTimestamp: string | null };

export const getSerializedRecords = (
  records: CreditApplicationRecordSparse[],
) => {
  const result: CreditApplicationRecordSparseSerialized[] = [];
  records.forEach((record) => {
    result.push({
      ...record,
      timestamp: getIsoYmdString(record.timestamp),
      icbcTimestamp: record.icbcTimestamp
        ? getIsoYmdString(record.icbcTimestamp)
        : null,
    });
  });
  return result;
};

export type CreditApplicationSparseSerialized = Omit<
  CreditApplicationSparse,
  "submissionTimestamp" | "supplierStatus" | "organization"
> & { submissionTimestamp: string; organization?: string };

export const getSerializedApplications = (
  records: CreditApplicationSparse[],
  userIsGov: boolean,
) => {
  const result: CreditApplicationSparseSerialized[] = [];
  records.forEach((record) => {
    const resultRecord: CreditApplicationSparseSerialized = {
      id: record.id,
      status: userIsGov ? record.status : record.supplierStatus,
      submissionTimestamp: getIsoYmdString(record.submissionTimestamp),
    };
    if (userIsGov) {
      resultRecord.organization = record.organization.name;
    }
    result.push(resultRecord);
  });
  return result;
};

export type ColsToHeadersMap = Partial<Record<string, string>>;

export const getColsToHeadersMap = (headersRow: Excel.Row) => {
  const headersMap: ColsToHeadersMap = {};
  headersRow.eachCell((cell) => {
    const col = cell.col;
    const value = cell.value?.toString();
    if (col && value) {
      headersMap[col] = value;
    }
  });
  return headersMap;
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
  const duplicateVins: string[] = [];
  const invalidRows: number[] = [];
  const headersIndex = SupplierTemplateZEVsSuppliedSheetData.HeaderIndex;
  const modelYearsMap = getStringsToModelYearsEnumsMap();
  const headers = sheet.getRow(headersIndex);
  const headersMap = getColsToHeadersMap(headers);
  const requiredHeaders = Object.values(
    SupplierTemplateZEVsSuppliedSheetHeaderNames,
  );
  requiredHeaders.forEach((requiredHeader) => {
    let found = false;
    headers.eachCell((header) => {
      const headerText = header.value?.toString();
      if (headerText && headerText === requiredHeader) {
        found = true;
      }
    });
    if (!found) {
      throw new Error(`Missing required header "${requiredHeader}"`);
    }
  });
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber > headersIndex) {
      let vin: string | undefined;
      let make: string | undefined;
      let modelName: string | undefined;
      let modelYear: ModelYear | undefined;
      let timestamp: Date | undefined;
      row.eachCell((cell) => {
        const col = cell.col;
        const header = headersMap[col];
        if (header) {
          const value = cell.value?.toString();
          if (value) {
            if (
              header === SupplierTemplateZEVsSuppliedSheetHeaderNames.VIN &&
              value.length === 17
            ) {
              vin = value;
            } else if (
              header === SupplierTemplateZEVsSuppliedSheetHeaderNames.Make
            ) {
              make = value;
            } else if (
              header === SupplierTemplateZEVsSuppliedSheetHeaderNames.ModelName
            ) {
              modelName = value;
            } else if (
              header === SupplierTemplateZEVsSuppliedSheetHeaderNames.ModelYear
            ) {
              const year = modelYearsMap[value];
              if (year) {
                modelYear = year;
              }
            } else if (
              header === SupplierTemplateZEVsSuppliedSheetHeaderNames.Date
            ) {
              const [isValidDate, date] = validateDate(value);
              if (isValidDate) {
                timestamp = date;
              }
            }
          }
        }
      });
      if (vin && make && modelName && modelYear && timestamp) {
        if (data[vin]) {
          duplicateVins.push(vin);
        }
        data[vin] = {
          make,
          modelName,
          modelYear,
          timestamp,
        };
      } else {
        invalidRows.push(rowNumber);
      }
    }
  });
  if (duplicateVins.length > 0) {
    throw new Error(`Duplicate VINs: ${duplicateVins.join(", ")}`);
  }
  if (invalidRows.length > 0) {
    throw new Error(
      `Rows with missing or invalid data: ${invalidRows.join(", ")}`,
    );
  }
  const numberOfVins = Object.keys(data).length;
  const maxVins = SupplierTemplateZEVsSuppliedSheetData.MaxNumberOfRecords;
  if (numberOfVins === 0 || numberOfVins > maxVins) {
    throw new Error(
      `Submission must have at least one VIN, and no more than ${maxVins} VINs`,
    );
  }
  return data;
};

export type WarningsMap = Partial<Record<string, string[]>>;

export const getWarningsMap = (
  recordsMap: VinRecordsMap,
  icbcMap: IcbcRecordsMap,
): WarningsMap => {
  const result: WarningsMap = {};
  Object.entries(recordsMap).forEach(([vin, data]) => {
    result[vin] = [];
    const vehicle = data.vehicle;
    const icbcRecord = icbcMap[vin];
    if (
      vehicle.status !== VehicleStatus.VALIDATED ||
      !vehicle.isActive ||
      !vehicle.creditValue ||
      !vehicle.zevClass ||
      !vehicle.vehicleClass
    ) {
      result[vin].push("1");
    }
    if (data.timestamp < new Date("2018-01-02T00:00:00")) {
      result[vin].push("51");
    }
    if (!icbcRecord) {
      result[vin].push("11");
    }
    if (vehicle && icbcRecord) {
      if (
        icbcRecord.make !== vehicle.make ||
        icbcRecord.modelYear !== vehicle.modelYear
      ) {
        result[vin].push("41");
      }
    }
    if (result[vin].length === 0) {
      delete result[vin];
    }
  });
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
