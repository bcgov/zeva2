// do not import, directly or indirectly, any Prisma versions of Decimal here!

import Excel, { Workbook } from "exceljs";
import { AssessmentTemplate, ForecastTemplate, MyrTemplate } from "./constants";
import { ModelYear } from "@/prisma/generated/client";
import { getModelYearEnumsToStringsMap } from "@/app/lib/utils/enumMaps";

export const getMyrSheets = (workbook: Workbook) => {
  const detailsSheet = workbook.getWorksheet(MyrTemplate.DetailsSheetName);
  const supplierDetailsSheet = workbook.getWorksheet(
    MyrTemplate.SupplierDetailsSheetName,
  );
  const vehicleStatisticsSheet = workbook.getWorksheet(
    MyrTemplate.VehicleStatisticsSheetName,
  );
  const complianceReductionsSheet = workbook.getWorksheet(
    MyrTemplate.ComplianceReductionsSheetName,
  );
  const beginningBalanceSheet = workbook.getWorksheet(
    MyrTemplate.BeginningBalanceSheetName,
  );
  const creditsSheet = workbook.getWorksheet(MyrTemplate.CreditsSheetName);
  const offsetsAndTransfersAwaySheet = workbook.getWorksheet(
    MyrTemplate.OffsetsAndTransfersAwaySheetName,
  );
  const prelimEndingBalanceSheet = workbook.getWorksheet(
    MyrTemplate.PreliminaryEndingBalance,
  );
  if (
    !detailsSheet ||
    !supplierDetailsSheet ||
    !vehicleStatisticsSheet ||
    !complianceReductionsSheet ||
    !beginningBalanceSheet ||
    !creditsSheet ||
    !offsetsAndTransfersAwaySheet ||
    !prelimEndingBalanceSheet
  ) {
    throw new Error("Missing sheet in Model Year Report!");
  }
  return {
    detailsSheet,
    supplierDetailsSheet,
    vehicleStatisticsSheet,
    complianceReductionsSheet,
    beginningBalanceSheet,
    creditsSheet,
    offsetsAndTransfersAwaySheet,
    prelimEndingBalanceSheet,
  };
};

export type FileZevUnitRecord = {
  type: string;
  vehicleClass: string;
  zevClass: string;
  modelYear: string;
  numberOfUnits: string;
};

export type FileFinalEndingBalanceRecord = {
  type: string;
  vehicleClass: string;
  zevClass: string;
  modelYear: string;
  initialNumberOfUnits: string;
  divisor: string;
  finalNumberOfUnits: string;
};

export type FileReductionRecord = {
  ratio: string;
  nv: string;
} & Omit<FileZevUnitRecord, "type">;

export type ParsedMyr = {
  details: FileMyrDetails;
  supplierDetails: FileMyrSupplierDetails;
  vehicleStatistics: FileVehicleStatistic[];
  complianceReductions: FileReductionRecord[];
  beginningBalance: FileZevUnitRecord[];
  credits: FileZevUnitRecord[];
  offsetsAndTransfersAway: FileZevUnitRecord[];
  prelimEndingBalance: FileZevUnitRecord[];
};

export const parseMyr = (workbook: Workbook): ParsedMyr => {
  const sheets = getMyrSheets(workbook);
  return {
    details: parseMyrDetails(sheets.detailsSheet),
    supplierDetails: parseSupplierDetails(sheets.supplierDetailsSheet),
    vehicleStatistics: parseVehicleStatistics(sheets.vehicleStatisticsSheet),
    complianceReductions: parseComplianceReductions(
      sheets.complianceReductionsSheet,
    ),
    beginningBalance: parseZevUnitRecords(sheets.beginningBalanceSheet),
    credits: parseZevUnitRecords(sheets.creditsSheet),
    offsetsAndTransfersAway: parseZevUnitRecords(
      sheets.offsetsAndTransfersAwaySheet,
    ),
    prelimEndingBalance: parseZevUnitRecords(sheets.prelimEndingBalanceSheet),
  };
};

type FileMyrDetails = {
  modelYear: string;
  zevClassOrdering: string;
};

const parseMyrDetails = (sheet: Excel.Worksheet): FileMyrDetails => {
  const row = sheet.getRow(2);
  return {
    modelYear: row.getCell(1).toString(),
    zevClassOrdering: row.getCell(2).toString(),
  };
};

type FileMyrSupplierDetails = {
  legalName: string;
  makes: string;
  classification: string;
  serviceAddress: string;
  recordsAddress: string;
};

const parseSupplierDetails = (
  sheet: Excel.Worksheet,
): FileMyrSupplierDetails => {
  const supplierDetailsRow = sheet.getRow(2);
  return {
    legalName: supplierDetailsRow.getCell(1).toString(),
    makes: supplierDetailsRow.getCell(2).toString(),
    classification: supplierDetailsRow.getCell(3).toString(),
    serviceAddress: supplierDetailsRow.getCell(4).toString(),
    recordsAddress: supplierDetailsRow.getCell(5).toString(),
  };
};

type FileVehicleStatistic = {
  vehicleClass: string;
  zevClass: string;
  make: string;
  modelName: string;
  modelYear: string;
  zevType: string;
  range: string;
  submittedCount: string;
  issuedCount: string;
};

const parseVehicleStatistics = (
  sheet: Excel.Worksheet,
): FileVehicleStatistic[] => {
  const result: FileVehicleStatistic[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      result.push({
        vehicleClass: row.getCell(1).toString(),
        zevClass: row.getCell(2).toString(),
        make: row.getCell(3).toString(),
        modelName: row.getCell(4).toString(),
        modelYear: row.getCell(5).toString(),
        zevType: row.getCell(6).toString(),
        range: row.getCell(7).toString(),
        submittedCount: row.getCell(8).toString(),
        issuedCount: row.getCell(9).toString(),
      });
    }
  });
  return result;
};

const parseComplianceReductions = (
  sheet: Excel.Worksheet,
): FileReductionRecord[] => {
  const result: FileReductionRecord[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      result.push({
        ratio: row.getCell(1).toString(),
        nv: row.getCell(2).toString(),
        vehicleClass: row.getCell(3).toString(),
        zevClass: row.getCell(4).toString(),
        modelYear: row.getCell(5).toString(),
        numberOfUnits: row.getCell(6).toString(),
      });
    }
  });
  return result;
};

const parseZevUnitRecords = (sheet: Excel.Worksheet): FileZevUnitRecord[] => {
  const result: FileZevUnitRecord[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      result.push({
        type: row.getCell(1).toString(),
        vehicleClass: row.getCell(2).toString(),
        zevClass: row.getCell(3).toString(),
        modelYear: row.getCell(4).toString(),
        numberOfUnits: row.getCell(5).toString(),
      });
    }
  });
  return result;
};

export const getAssessmentSheets = (workbook: Workbook) => {
  const detailsSheet = workbook.getWorksheet(
    AssessmentTemplate.DetailsSheetName,
  );
  const complianceReductionsSheet = workbook.getWorksheet(
    AssessmentTemplate.ComplianceReductionsSheetName,
  );
  const beginningBalanceSheet = workbook.getWorksheet(
    AssessmentTemplate.BeginningBalanceSheetName,
  );
  const creditsSheet = workbook.getWorksheet(
    AssessmentTemplate.CreditsSheetName,
  );
  const previousAdjustmentsSheet = workbook.getWorksheet(
    AssessmentTemplate.PreviousAdjustmentsSheetName,
  );
  const currentAdjustmentsSheet = workbook.getWorksheet(
    AssessmentTemplate.CurrentAdjustmentsSheetName,
  );
  const offsetsAndTransfersAwaySheet = workbook.getWorksheet(
    AssessmentTemplate.OffsetsAndTransfersAwaySheetName,
  );
  const finalEndingBalanceSheet = workbook.getWorksheet(
    AssessmentTemplate.FinalEndingBalanceSheetName,
  );
  const statementsSheet = workbook.getWorksheet(
    AssessmentTemplate.StatementsSheetName,
  );
  if (
    !detailsSheet ||
    !complianceReductionsSheet ||
    !beginningBalanceSheet ||
    !creditsSheet ||
    !previousAdjustmentsSheet ||
    !currentAdjustmentsSheet ||
    !offsetsAndTransfersAwaySheet ||
    !finalEndingBalanceSheet ||
    !statementsSheet
  ) {
    throw new Error("Missing sheet in Assessment!");
  }
  return {
    detailsSheet,
    complianceReductionsSheet,
    beginningBalanceSheet,
    creditsSheet,
    previousAdjustmentsSheet,
    currentAdjustmentsSheet,
    offsetsAndTransfersAwaySheet,
    finalEndingBalanceSheet,
    statementsSheet,
  };
};

export type ParsedAssmnt = {
  details: FileAssessmentDetails;
  complianceReductions: FileReductionRecord[];
  beginningBalance: FileZevUnitRecord[];
  credits: FileZevUnitRecord[];
  previousAdjustments: FileZevUnitRecord[];
  currentAdjustments: FileZevUnitRecord[];
  offsetsAndTransfersAway: FileZevUnitRecord[];
  finalEndingBalance: FileFinalEndingBalanceRecord[];
  statements: string[];
};

export type FileAssessmentDetails = {
  supplierName: string;
  modelYear: string;
  classification: string;
  zevClassOrdering: string;
  isCompliant: string;
};

export const parseAssessment = (workbook: Workbook): ParsedAssmnt => {
  const sheets = getAssessmentSheets(workbook);
  return {
    details: parseAssessmentDetails(sheets.detailsSheet),
    complianceReductions: parseComplianceReductions(
      sheets.complianceReductionsSheet,
    ),
    beginningBalance: parseZevUnitRecords(sheets.beginningBalanceSheet),
    credits: parseZevUnitRecords(sheets.creditsSheet),
    previousAdjustments: parseZevUnitRecords(sheets.previousAdjustmentsSheet),
    currentAdjustments: parseZevUnitRecords(sheets.currentAdjustmentsSheet),
    offsetsAndTransfersAway: parseZevUnitRecords(
      sheets.offsetsAndTransfersAwaySheet,
    ),
    finalEndingBalance: parseFinalEndingBalance(sheets.finalEndingBalanceSheet),
    statements: parseStatements(sheets.statementsSheet),
  };
};

const parseAssessmentDetails = (
  sheet: Excel.Worksheet,
): FileAssessmentDetails => {
  const row = sheet.getRow(2);
  return {
    supplierName: row.getCell(1).toString(),
    modelYear: row.getCell(2).toString(),
    classification: row.getCell(3).toString(),
    zevClassOrdering: row.getCell(4).toString(),
    isCompliant: row.getCell(5).toString(),
  };
};

const parseFinalEndingBalance = (
  sheet: Excel.Worksheet,
): FileFinalEndingBalanceRecord[] => {
  const result: FileFinalEndingBalanceRecord[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      result.push({
        type: row.getCell(1).toString(),
        vehicleClass: row.getCell(2).toString(),
        zevClass: row.getCell(3).toString(),
        modelYear: row.getCell(4).toString(),
        initialNumberOfUnits: row.getCell(5).toString(),
        divisor: row.getCell(6).toString(),
        finalNumberOfUnits: row.getCell(7).toString(),
      });
    }
  });
  return result;
};

const parseStatements = (sheet: Excel.Worksheet): string[] => {
  const result: string[] = [];
  sheet.eachRow((row) => {
    result.push(row.getCell(1).toString());
  });
  return result;
};

export const getForecastSheets = (workbook: Workbook) => {
  const zevSheet = workbook.getWorksheet(ForecastTemplate.ZevForecastSheetName);
  const nonZevSheet = workbook.getWorksheet(
    ForecastTemplate.NonZevForecastSheetName,
  );
  if (!zevSheet || !nonZevSheet) {
    throw new Error("Missing sheet in Forecast Report!");
  }
  return {
    zevSheet,
    nonZevSheet,
  };
};

export const getNextThreeModelYears = (modelYear: ModelYear) => {
  const futureModelYears = Object.values(ModelYear).filter(
    (my) => my > modelYear,
  );
  const nextThreeModelYearsPrelim = futureModelYears.slice(0, 3);
  const modelYearsMap = getModelYearEnumsToStringsMap();
  const nextThreeModelYears: string[] = [];
  for (const my of nextThreeModelYearsPrelim) {
    const myString = modelYearsMap[my];
    if (myString) {
      nextThreeModelYears.push(myString);
    }
  }
  if (nextThreeModelYears.length !== 3) {
    throw new Error("Not enough future Model Years!");
  }
  return nextThreeModelYears;
};

type ZevForecastRecord = {
  modelYear: string;
  make: string;
  model: string;
  type: string;
  range: string;
  zevClass: string;
  interiorVolume: string;
  supplyForecast: string;
};

type ForecastStatistics = [
  ["", string, string, string],
  ["ZEV Supply Forecast", number, number, number],
  ["Non-ZEV Supply Forecast", number, number, number],
  ["Totals", number, number, number],
];

export type ParsedForecast = {
  zevRecords: ZevForecastRecord[];
  statistics: ForecastStatistics;
};

export const parseForecast = (
  workbook: Workbook,
  myrModelYear: ModelYear,
): ParsedForecast => {
  const sheets = getForecastSheets(workbook);
  const nextThreeModelYears = getNextThreeModelYears(myrModelYear);
  const my1 = nextThreeModelYears[0];
  const my2 = nextThreeModelYears[1];
  const my3 = nextThreeModelYears[2];
  const zevRecords: ZevForecastRecord[] = [];
  const zevSupplyTotals = {
    [my1]: 0,
    [my2]: 0,
    [my3]: 0,
  };
  sheets.zevSheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      const modelYear = row.getCell(1).toString();
      const supplyForecast = row.getCell(8).toString();
      if (Object.hasOwn(zevSupplyTotals, modelYear)) {
        zevSupplyTotals[modelYear] =
          zevSupplyTotals[modelYear] + Number.parseInt(supplyForecast, 10);
      }
      zevRecords.push({
        modelYear,
        make: row.getCell(2).toString(),
        model: row.getCell(3).toString(),
        type: row.getCell(4).toString(),
        range: row.getCell(5).toString(),
        zevClass: row.getCell(6).toString(),
        interiorVolume: row.getCell(7).toString(),
        supplyForecast,
      });
    }
  });
  const nonZevSupplyTotals = {
    [my1]: 0,
    [my2]: 0,
    [my3]: 0,
  };
  sheets.nonZevSheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      const modelYear = row.getCell(1).toString();
      const supplyForecast = row.getCell(2).toString();
      if (Object.hasOwn(nonZevSupplyTotals, modelYear)) {
        nonZevSupplyTotals[modelYear] =
          nonZevSupplyTotals[modelYear] + Number.parseInt(supplyForecast, 10);
      }
    }
  });
  const statistics: ForecastStatistics = [
    ["", my1, my2, my3],
    [
      "ZEV Supply Forecast",
      zevSupplyTotals[my1],
      zevSupplyTotals[my2],
      zevSupplyTotals[my3],
    ],
    [
      "Non-ZEV Supply Forecast",
      nonZevSupplyTotals[my1],
      nonZevSupplyTotals[my2],
      nonZevSupplyTotals[my3],
    ],
    [
      "Totals",
      zevSupplyTotals[my1] + nonZevSupplyTotals[my1],
      zevSupplyTotals[my2] + nonZevSupplyTotals[my2],
      zevSupplyTotals[my3] + nonZevSupplyTotals[my3],
    ],
  ];
  return {
    zevRecords,
    statistics,
  };
};
