import Excel from "exceljs";
import { ModelYear, VehicleStatus } from "@/prisma/generated/client";
import {
  getModelYearEnumsToStringsMap,
  getStringsToModelYearsEnumsMap,
  getVehicleClassEnumsToStringsMap,
  getZevClassEnumsToStringsMap,
} from "@/app/lib/utils/enumMaps";
import {
  curableErrors,
  GovTemplateCurableVinsHeaderNames,
  GovTemplateValidVinsHeaderNames,
  incurableErrors,
  SheetStructure,
  SupplierTemplateZEVsSuppliedHeaderNames,
} from "./constants";
import { IcbcRecordsMap, VehiclesMap, VinRecordsMap } from "./services";
import { Prisma } from "@/prisma/generated/client";

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

export type HeadersToColsMap = Partial<Record<string, number>>;

export const getHeadersToColsMap = (
  headersRow: Excel.Row,
): HeadersToColsMap => {
  const headersMap: HeadersToColsMap = {};
  headersRow.eachCell((cell) => {
    let col = parseInt(cell.col, 10);
    const value = cell.value?.toString();
    if (col && value) {
      headersMap[value] = col;
    }
  });
  return headersMap;
};

export const getSupplierVehiclesWhereClause = (
  orgId: number,
): Prisma.VehicleWhereInput => {
  return {
    organizationId: orgId,
    status: VehicleStatus.VALIDATED,
    vehicleClass: {
      not: null,
    },
    zevClass: {
      not: null,
    },
    creditValue: {
      not: null,
    },
    isActive: true,
  };
};

export const getSupplierVehiclesSelectClause = (): Prisma.VehicleSelect => {
  return {
    id: true,
    make: true,
    modelName: true,
    modelYear: true,
  };
};

export const validateSupplierSheet = (sheet: Excel.Worksheet) => {
  const data: Record<
    string,
    {
      make: string;
      modelName: string;
      modelYear: ModelYear;
      timestamp: Date;
    }
  > = {};
  const rowCount = sheet.rowCount;
  const actualRowCount = sheet.actualRowCount;
  if (rowCount !== actualRowCount) {
    throw new Error("All rows in the submission must be consecutive!");
  }
  if (
    rowCount < SheetStructure.FirstRowIndex ||
    rowCount > SheetStructure.FinalRowIndex
  ) {
    throw new Error(
      "Submission must have at least one VIN, and no more than 2000 VINs",
    );
  }
  const headersIndex = SheetStructure.HeaderIndex;
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
          const value = cell.value?.toString();
          if (value) {
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
              timestamp = new Date(value);
            }
          }
        }
      });
      if (vin && make && modelName && modelYear && timestamp) {
        if (data[vin]) {
          throw new Error(`Duplicate Vin at row ${rowNumber}`);
        }
        data[vin] = {
          make,
          modelName,
          modelYear,
          timestamp,
        };
      } else {
        throw new Error(`Invalid row at row ${rowNumber}`);
      }
    }
  });
  return data;
};

export const populateErrors = (
  recordsMap: VinRecordsMap,
  vehiclesMap: VehiclesMap,
  icbcMap: IcbcRecordsMap,
) => {
  for (const [vin, data] of Object.entries(recordsMap)) {
    const vehicle = vehiclesMap[data.vehicleId];
    const icbcRecord = icbcMap[vin];
    const errors = data.errors;
    if (!vehicle) {
      errors.push("1");
    }
    if (!icbcRecord) {
      errors.push("11");
    }
    if (
      vehicle &&
      icbcRecord &&
      (icbcRecord.make !== vehicle.make ||
        icbcRecord.year !== vehicle.modelYear)
    ) {
      errors.push("41");
    }
  }
};

export const populateValidVins = (
  sheet: Excel.Worksheet,
  recordsMap: VinRecordsMap,
  vehiclesMap: VehiclesMap,
  icbcMap: IcbcRecordsMap,
) => {
  const headerIndex = SheetStructure.HeaderIndex;
  const headersRow = sheet.getRow(headerIndex);
  const headersMap = getHeadersToColsMap(headersRow);
  const vinCol = headersMap[GovTemplateValidVinsHeaderNames.VIN];
  const makeCol = headersMap[GovTemplateValidVinsHeaderNames.Make];
  const modelNameCol = headersMap[GovTemplateValidVinsHeaderNames.ModelName];
  const modelYearCol = headersMap[GovTemplateValidVinsHeaderNames.ModelYear];
  const icbcMakeCol = headersMap[GovTemplateValidVinsHeaderNames.IcbcMake];
  const icbcModelNameCol =
    headersMap[GovTemplateValidVinsHeaderNames.IcbcModelName];
  const icbcModelYearCol =
    headersMap[GovTemplateValidVinsHeaderNames.IcbcModelYear];
  const icbcFileDateCol =
    headersMap[GovTemplateValidVinsHeaderNames.IcbcFileDate];
  const dateCol = headersMap[GovTemplateValidVinsHeaderNames.Date];
  const vehicleClassCol =
    headersMap[GovTemplateValidVinsHeaderNames.VehicleClass];
  const zevClassCol = headersMap[GovTemplateValidVinsHeaderNames.ZevClass];
  const numberOfCreditsCol =
    headersMap[GovTemplateValidVinsHeaderNames.NumberOfCredits];

  if (
    !vinCol ||
    !makeCol ||
    !modelNameCol ||
    !modelYearCol ||
    !icbcMakeCol ||
    !icbcModelNameCol ||
    !icbcModelYearCol ||
    !icbcFileDateCol ||
    !dateCol ||
    !vehicleClassCol ||
    !zevClassCol ||
    !numberOfCreditsCol
  ) {
    throw new Error("Missing required headers!");
  }

  const vehicleClassMap = getVehicleClassEnumsToStringsMap();
  const zevClassMap = getZevClassEnumsToStringsMap();
  const modelYearMap = getModelYearEnumsToStringsMap();

  const dataRows: Record<string, any>[] = [];
  for (const [vin, data] of Object.entries(recordsMap)) {
    if (data.errors.length > 0) {
      continue;
    }
    const vehicle = vehiclesMap[data.vehicleId];
    const associatedIcbcRecord = icbcMap[vin];
    if (!vehicle || !associatedIcbcRecord) {
      throw new Error(
        `You must call "populateErrors" before calling "populateValidVins"!`,
      );
    }
    const make = vehicle.make;
    const modelYear = vehicle.modelYear;
    const icbcMake = associatedIcbcRecord.make;
    const icbcYear = associatedIcbcRecord.year;
    const modelName = vehicle.modelName;
    const vehicleClass = vehicle.vehicleClass;
    const zevClass = vehicle.zevClass;
    const creditValue = vehicle.creditValue;
    const icbcModel = associatedIcbcRecord.model;
    const icbcTimestamp = associatedIcbcRecord.timestamp;
    const recordTimestamp = data.timestamp;

    const row: Record<string, any> = {};
    row[vinCol] = vin;
    row[makeCol] = make;
    row[modelNameCol] = modelName;
    row[modelYearCol] = modelYearMap[modelYear];
    row[icbcMakeCol] = icbcMake;
    row[icbcModelNameCol] = icbcModel;
    row[icbcModelYearCol] = modelYearMap[icbcYear];
    row[icbcFileDateCol] = icbcTimestamp;
    row[dateCol] = recordTimestamp;
    row[vehicleClassCol] = vehicleClassMap[vehicleClass];
    row[zevClassCol] = zevClassMap[zevClass];
    row[numberOfCreditsCol] = creditValue;
    dataRows.push(row);
  }
  dataRows.forEach((dataRow, index) => {
    const sheetRow = sheet.getRow(index + 1 + headerIndex);
    const cols = Object.keys(dataRow).map(Number);
    cols.forEach((col) => {
      const cell = sheetRow.getCell(col);
      cell.value = dataRow[col];
    });
  });
};

export const populateCurableVins = (
  sheet: Excel.Worksheet,
  recordsMap: VinRecordsMap,
  vehiclesMap: VehiclesMap,
  icbcMap: IcbcRecordsMap,
) => {
  const headerIndex = SheetStructure.HeaderIndex;
  const headersRow = sheet.getRow(headerIndex);
  const headersMap = getHeadersToColsMap(headersRow);
  const vinCol = headersMap[GovTemplateCurableVinsHeaderNames.VIN];
  const makeCol = headersMap[GovTemplateCurableVinsHeaderNames.Make];
  const modelNameCol = headersMap[GovTemplateCurableVinsHeaderNames.ModelName];
  const modelYearCol = headersMap[GovTemplateCurableVinsHeaderNames.ModelYear];
  const icbcMakeCol = headersMap[GovTemplateCurableVinsHeaderNames.IcbcMake];
  const icbcModelNameCol =
    headersMap[GovTemplateCurableVinsHeaderNames.IcbcModelName];
  const icbcModelYearCol =
    headersMap[GovTemplateCurableVinsHeaderNames.IcbcModelYear];
  const icbcFileDateCol =
    headersMap[GovTemplateCurableVinsHeaderNames.IcbcFileDate];
  const dateCol = headersMap[GovTemplateCurableVinsHeaderNames.Date];
  const vehicleClassCol =
    headersMap[GovTemplateCurableVinsHeaderNames.VehicleClass];
  const zevClassCol = headersMap[GovTemplateCurableVinsHeaderNames.ZevClass];
  const numberOfCreditsCol =
    headersMap[GovTemplateCurableVinsHeaderNames.NumberOfCredits];
  const errorsCol = headersMap[GovTemplateCurableVinsHeaderNames.Errors];

  if (
    !vinCol ||
    !makeCol ||
    !modelNameCol ||
    !modelYearCol ||
    !icbcMakeCol ||
    !icbcModelNameCol ||
    !icbcModelYearCol ||
    !icbcFileDateCol ||
    !dateCol ||
    !vehicleClassCol ||
    !zevClassCol ||
    !numberOfCreditsCol ||
    !errorsCol
  ) {
    throw new Error("Missing required headers!");
  }

  const vehicleClassMap = getVehicleClassEnumsToStringsMap();
  const zevClassMap = getZevClassEnumsToStringsMap();
  const modelYearMap = getModelYearEnumsToStringsMap();
  const incurableErrorsSet = new Set(incurableErrors);
  const curableErrorsSet = new Set(curableErrors);

  const dataRows: Record<string, any>[] = [];
  for (const [vin, data] of Object.entries(recordsMap)) {
    const errors = new Set(data.errors);
    if (errors.size === 0) {
      continue;
    }
    if (errors.isSubsetOf(incurableErrorsSet)) {
      continue;
    }
    if (errors.isSubsetOf(curableErrorsSet)) {
      const row: Record<string, any> = {};
      const vehicle = vehiclesMap[data.vehicleId];
      if (!vehicle) {
        throw new Error(
          "No incurable errors implies associated vehicle exists!",
        );
      }
      const recordTimestamp = data.timestamp;
      const make = vehicle.make;
      const modelName = vehicle.modelName;
      const modelYear = vehicle.modelYear;
      const vehicleClass = vehicle.vehicleClass;
      const zevClass = vehicle.zevClass;
      const creditValue = vehicle.creditValue;

      row[vinCol] = vin;
      row[makeCol] = make;
      row[modelNameCol] = modelName;
      row[modelYearCol] = modelYearMap[modelYear];
      row[dateCol] = recordTimestamp;
      row[vehicleClassCol] = vehicleClassMap[vehicleClass];
      row[zevClassCol] = zevClassMap[zevClass];
      row[numberOfCreditsCol] = creditValue;
      row[errorsCol] = data.errors.join(", ");

      const associatedIcbcRecord = icbcMap[vin];
      if (associatedIcbcRecord) {
        const icbcMake = associatedIcbcRecord.make;
        const icbcModel = associatedIcbcRecord.model;
        const icbcYear = associatedIcbcRecord.year;
        const icbcTimestamp = associatedIcbcRecord.timestamp;
        row[icbcMakeCol] = icbcMake;
        row[icbcModelNameCol] = icbcModel;
        row[icbcModelYearCol] = modelYearMap[icbcYear];
        row[icbcFileDateCol] = icbcTimestamp;
      }
      dataRows.push(row);
    }
  }
  dataRows.forEach((dataRow, index) => {
    const sheetRow = sheet.getRow(index + 1 + headerIndex);
    const cols = Object.keys(dataRow).map(Number);
    cols.forEach((col) => {
      const cell = sheetRow.getCell(col);
      cell.value = dataRow[col];
    });
  });
};

export const populateIncurableVins = () => {};
