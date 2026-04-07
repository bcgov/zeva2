import Excel, { Workbook } from "exceljs";
import {
  AssessmentTemplate,
  ForecastTemplate,
  MyrTemplate,
  SupplierZevClassChoice,
  supplierZevClasses,
} from "./constants";
import {
  ModelYear,
  ReferenceType,
  SupplierClass,
  TransactionType,
  VehicleClass,
  ZevClass,
} from "@/prisma/generated/enums";
import {
  getBalanceTypeEnumsToStringsMap,
  getModelYearEnumsToStringsMap,
  getReferenceTypeEnumsToStringsMap,
  getStringsToVehicleClassEnumsMap,
  getStringsToZevClassEnumsMap,
  getSupplierClassEnumsToStringsMap,
  getTransactionTypeEnumsToStringMap,
  getVehicleClassEnumsToStringsMap,
  getZevClassEnumsToStringsMap,
} from "@/app/lib/utils/enumMaps";
import { VehicleStatistic } from "./services";
import { NvValues } from "./actions";
import { OrganizationAddressModel } from "@/prisma/generated/models";

export const getMyrSheets = (workbook: Workbook) => {
  const supplierDetailsSheet = workbook.getWorksheet(
    MyrTemplate.SupplierDetailsSheetName,
  );
  const previousVolumesSheet = workbook.getWorksheet(
    MyrTemplate.PreviousVolumesSheetName,
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
  const pendingSupplyCreditsSheet = workbook.getWorksheet(
    MyrTemplate.PendingSupplyCreditsSheetName,
  );
  const adjustmentsSheet = workbook.getWorksheet(
    MyrTemplate.AdjustmentsSheetName,
  );
  const suggestedAdjustmentsSheet = workbook.getWorksheet(
    MyrTemplate.SuggestedAdjustmentsSheetName,
  );
  const offsetsAndTransfersAwaySheet = workbook.getWorksheet(
    MyrTemplate.OffsetsAndTransfersAwaySheetName,
  );
  const prelimEndingBalanceSheet = workbook.getWorksheet(
    MyrTemplate.PreliminaryEndingBalance,
  );
  if (
    !supplierDetailsSheet ||
    !previousVolumesSheet ||
    !vehicleStatisticsSheet ||
    !complianceReductionsSheet ||
    !beginningBalanceSheet ||
    !creditsSheet ||
    !pendingSupplyCreditsSheet ||
    !adjustmentsSheet ||
    !suggestedAdjustmentsSheet ||
    !offsetsAndTransfersAwaySheet ||
    !prelimEndingBalanceSheet
  ) {
    throw new Error("Missing sheet in Model Year Report!");
  }
  return {
    supplierDetailsSheet,
    previousVolumesSheet,
    vehicleStatisticsSheet,
    complianceReductionsSheet,
    beginningBalanceSheet,
    creditsSheet,
    pendingSupplyCreditsSheet,
    adjustmentsSheet,
    suggestedAdjustmentsSheet,
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
  supplierDetails: FileMyrSupplierDetails;
  previousVolumes: FileMyrPreviousVolumes[];
  vehicleStatistics: FileVehicleStatistic[];
  complianceReductions: FileReductionRecord[];
  beginningBalance: FileZevUnitRecord[];
  credits: FileZevUnitRecord[];
  pendingSupplyCredits: FileMyrPendingSupplyCredit[];
  adjustments: FileZevUnitRecord[];
  suggestedAdjustments: FileZevUnitRecord[];
  offsetsAndTransfersAway: FileZevUnitRecord[];
  prelimEndingBalance: FileZevUnitRecord[];
};

export const parseMyr = (workbook: Workbook): ParsedMyr => {
  const sheets = getMyrSheets(workbook);
  return {
    supplierDetails: parseSupplierDetails(sheets.supplierDetailsSheet),
    previousVolumes: parsePreviousVolumes(sheets.previousVolumesSheet),
    vehicleStatistics: parseVehicleStatistics(sheets.vehicleStatisticsSheet),
    complianceReductions: parseComplianceReductions(
      sheets.complianceReductionsSheet,
    ),
    beginningBalance: parseZevUnitRecords(sheets.beginningBalanceSheet),
    credits: parseZevUnitRecords(sheets.creditsSheet),
    pendingSupplyCredits: parsePendingSupplyCredits(
      sheets.pendingSupplyCreditsSheet,
    ),
    adjustments: parseZevUnitRecords(sheets.adjustmentsSheet),
    suggestedAdjustments: parseZevUnitRecords(sheets.suggestedAdjustmentsSheet),
    offsetsAndTransfersAway: parseZevUnitRecords(
      sheets.offsetsAndTransfersAwaySheet,
    ),
    prelimEndingBalance: parseZevUnitRecords(sheets.prelimEndingBalanceSheet),
  };
};

type FileMyrSupplierDetails = {
  legalName: string;
  makes: string;
  classification: string;
  serviceAddress: string;
  recordsAddress: string;
  zevClassOrdering: string;
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
    zevClassOrdering: supplierDetailsRow.getCell(6).toString(),
  };
};

export const getZevClassChoice = (
  zevClassOrdering: string,
): SupplierZevClassChoice => {
  const zevClassesMap = getStringsToZevClassEnumsMap();
  const orderingOfEnums = zevClassOrdering
    .split(",")
    .map((s) => zevClassesMap[s.trim()])
    .filter((zc) => !!zc);
  const zevClassChoices: ZevClass[] = Object.values(supplierZevClasses);
  const choice = orderingOfEnums.filter((zc) =>
    zevClassChoices.includes(zc),
  )[0];
  if (choice === supplierZevClasses.A || choice === supplierZevClasses.B) {
    return choice;
  }
  return ZevClass.B;
};

type FileMyrPreviousVolumes = {
  modelYear: string;
  vehicleClass: string;
  volume: string;
};

const parsePreviousVolumes = (sheet: Excel.Worksheet) => {
  const result: FileMyrPreviousVolumes[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      result.push({
        modelYear: row.getCell(1).toString(),
        vehicleClass: row.getCell(2).toString(),
        volume: row.getCell(3).toString(),
      });
    }
  });
  return result;
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

export const getNvValues = (reductions: FileReductionRecord[]) => {
  const result: NvValues = {};
  const vehicleClassesMap = getStringsToVehicleClassEnumsMap();
  for (const reduction of reductions) {
    const vehicleClass = vehicleClassesMap[reduction.vehicleClass];
    if (vehicleClass) {
      result[vehicleClass] = reduction.nv;
    }
  }
  return result;
};

type FileMyrPendingSupplyCredit = {
  vehicleClass: string;
  zevClass: string;
  modelYear: string;
  numberOfUnits: string;
};

const parsePendingSupplyCredits = (sheet: Excel.Worksheet) => {
  const result: FileMyrPendingSupplyCredit[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      result.push({
        vehicleClass: row.getCell(1).toString(),
        zevClass: row.getCell(2).toString(),
        modelYear: row.getCell(3).toString(),
        numberOfUnits: row.getCell(4).toString(),
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
  classification: string;
  isCompliant: string;
  zevClassOrdering: string;
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
    classification: row.getCell(1).toString(),
    isCompliant: row.getCell(2).toString(),
    zevClassOrdering: row.getCell(3).toString(),
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

export type MyrHelpingMaps = {
  transactionTypesMap: Partial<Record<TransactionType, string>>;
  balanceTypesMap: Partial<Record<TransactionType, string>>;
  referenceTypesMap: Partial<Record<ReferenceType, string>>;
  vehicleClassesMap: Partial<Record<VehicleClass, string>>;
  zevClassesMap: Partial<Record<ZevClass, string>>;
  modelYearsMap: Partial<Record<ModelYear, string>>;
  supplierClassesMap: Partial<Record<SupplierClass, string>>;
};

export const getHelpingMaps = (): MyrHelpingMaps => {
  return {
    transactionTypesMap: getTransactionTypeEnumsToStringMap(),
    balanceTypesMap: getBalanceTypeEnumsToStringsMap(),
    referenceTypesMap: getReferenceTypeEnumsToStringsMap(),
    vehicleClassesMap: getVehicleClassEnumsToStringsMap(),
    zevClassesMap: getZevClassEnumsToStringsMap(),
    modelYearsMap: getModelYearEnumsToStringsMap(),
    supplierClassesMap: getSupplierClassEnumsToStringsMap(),
  };
};

export type VehicleStatString = Partial<Record<keyof VehicleStatistic, string>>;

export const getVehicleStatsAsStrings = (
  vehicleStats: VehicleStatistic[],
): VehicleStatString[] => {
  const result: VehicleStatString[] = [];
  const helpingMaps = getHelpingMaps();
  for (const vehicle of vehicleStats) {
    result.push({
      vehicleClass: helpingMaps.vehicleClassesMap[vehicle.vehicleClass],
      zevClass: helpingMaps.zevClassesMap[vehicle.zevClass],
      make: vehicle.make,
      modelName: vehicle.modelName,
      modelYear: helpingMaps.modelYearsMap[vehicle.modelYear],
      zevType: vehicle.zevType,
      range: vehicle.range.toString(),
      submittedCount: vehicle.submittedCount.toString(),
      issuedCount: vehicle.issuedCount.toString(),
    });
  }
  return result;
};

export const getAddressAsString = (address: OrganizationAddressModel) => {
  return `${address.addressLines}, ${address.city}, ${address.state}, ${address.postalCode}, ${address.country}`;
};
