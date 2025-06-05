import Excel from "exceljs";
import { ModelYear, VehicleStatus } from "@/prisma/generated/client";
import { getStringsToModelYearsEnumsMap } from "@/app/lib/utils/enumMaps";
import {
  CreditApplicationSubDirectory,
  SupplierTemplate,
  SupplierTemplateZEVsSuppliedHeaderNames,
} from "./constants";
import { IcbcRecordsMap, VehicleSparse, VinRecordsMap } from "./services";
import { Prisma } from "@/prisma/generated/client";
import { CreditApplicationCredit } from "./data";

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

export const getRecordsWhereClause = (
  filters: Record<string, string>,
): Prisma.CreditApplicationRecordWhereInput => {
  const result: Prisma.CreditApplicationRecordWhereInput = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (key === "validated") {
    } else if (key === "modelYear" || key === "icbcModelYear") {
    } else if (key === "timestamp" || key === "icbcTimestamp") {
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
      const newValue = value.replaceAll(" ", "").split(",");
      result[key] = {
        hasSome: newValue,
      };
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
      (key === "vin" || key === "timestamp")
    ) {
      result.push({ [key]: value });
    }
  });
  if (defaultSortById && result.length === 0) {
    result.push({ id: "desc" });
  }
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
  const rowCount = sheet.rowCount;
  const actualRowCount = sheet.actualRowCount;
  if (rowCount !== actualRowCount) {
    throw new Error("All rows in the submission must be consecutive!");
  }
  if (
    rowCount < SupplierTemplate.FirstRowIndex ||
    rowCount > SupplierTemplate.FinalRowIndex
  ) {
    throw new Error(
      "Submission must have at least one VIN, and no more than 2000 VINs",
    );
  }
  const headersIndex = SupplierTemplate.HeaderIndex;
  const modelYearsMap = getStringsToModelYearsEnumsMap();
  const headers = sheet.getRow(headersIndex);
  const headersMap = getColsToHeadersMap(headers);
  const requiredHeaders = Object.values(
    SupplierTemplateZEVsSuppliedHeaderNames,
  );
  requiredHeaders.forEach((requiredHeader) => {
    let found = false;
    headers.eachCell((header) => {
      const headerText = header.value?.toString();
      if (headerText && headerText === requiredHeader) {
        found = true;
        return;
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
          const originalValue = cell.value;
          const value = originalValue?.toString();
          if (originalValue && value) {
            if (
              header === SupplierTemplateZEVsSuppliedHeaderNames.VIN &&
              value.length === 17
            ) {
              vin = value;
            } else if (
              header === SupplierTemplateZEVsSuppliedHeaderNames.Make
            ) {
              make = value;
            } else if (
              header === SupplierTemplateZEVsSuppliedHeaderNames.ModelName
            ) {
              modelName = value;
            } else if (
              header === SupplierTemplateZEVsSuppliedHeaderNames.ModelYear
            ) {
              const year = modelYearsMap[value];
              if (year) {
                modelYear = year;
              }
            } else if (
              header === SupplierTemplateZEVsSuppliedHeaderNames.Date
            ) {
              if (originalValue instanceof Date) {
                originalValue.setHours(8);
                timestamp = originalValue;
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
    if (!icbcRecord) {
      result[vin].push("11");
    }
    if (vehicle && icbcRecord) {
      if (icbcRecord.make !== vehicle.make) {
        result[vin].push("21");
      }
      if (icbcRecord.modelYear !== vehicle.modelYear) {
        result[vin].push("31");
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
