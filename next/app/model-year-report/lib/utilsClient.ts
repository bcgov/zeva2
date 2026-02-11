// Do not import, directly or indirectly, Prisma's node version of Decimal here;
// use its browser version instead!

import { Decimal } from "@/prisma/generated/client/runtime/index-browser";
import Excel, { Workbook } from "exceljs";
import {
  ModelYear,
  ReferenceType,
  SupplierClass,
  TransactionType,
  VehicleClass,
  ZevClass,
} from "@/prisma/generated/client";
import {
  MyrComplianceReductions,
  MyrCurrentTransactions,
  MyrData,
  MyrOffsets,
  MyrEndingBalance,
  NvValues,
  AdjustmentPayload,
  AssessmentData,
} from "./actions";
import {
  divisors,
  interiorVolumes,
  IsCompliant,
  SupplierZevClassChoice,
} from "./constants";
import { Adjustment } from "./components/Adjustments";
import { ComplianceInfo, UnitsAsString } from "./utilsServer";
import {
  getAssessmentSheets,
  getForecastSheets,
  getHelpingMaps,
  getMyrSheets,
  getNextThreeModelYears,
  MyrHelpingMaps,
  VehicleStatString,
} from "./utils";
import { ZevUnitRecord } from "@/lib/utils/zevUnit";
import {
  getStringsToBalanceTypeEnumsMap,
  getStringsToModelYearsEnumsMap,
  getStringsToVehicleClassEnumsMap,
  getStringsToZevClassEnumsMap,
} from "@/app/lib/utils/enumMaps";

export const getZevClassOrdering = (
  priorityZevClass: SupplierZevClassChoice,
): ZevClass[] => {
  switch (priorityZevClass) {
    case ZevClass.A:
      return [ZevClass.UNSPECIFIED, ZevClass.A, ZevClass.B, ZevClass.C];
    case ZevClass.B:
      return [ZevClass.UNSPECIFIED, ZevClass.B, ZevClass.A, ZevClass.C];
  }
};

export const validateNvValues = (nvValues: NvValues) => {
  if (!nvValues.REPORTABLE) {
    throw new Error("NV value for Reportable vehicles not found!");
  }
  Object.values(nvValues).forEach((value) => {
    try {
      const valueDecimal = new Decimal(value);
      if (!valueDecimal.isInteger()) {
        throw new Error();
      }
    } catch (e) {
      throw new Error("Invalid NV value!");
    }
  });
};

export const getAdjustmentsPayload = (
  adjustments: Adjustment[],
): AdjustmentPayload[] => {
  const result: AdjustmentPayload[] = [];
  const balanceTypesMap = getStringsToBalanceTypeEnumsMap();
  const vehicleClassesMap = getStringsToVehicleClassEnumsMap();
  const zevClassesMap = getStringsToZevClassEnumsMap();
  const modelYearsMap = getStringsToModelYearsEnumsMap();
  for (const adjustment of adjustments) {
    const type = balanceTypesMap[adjustment.type];
    const vehicleClass = vehicleClassesMap[adjustment.vehicleClass];
    const zevClass = zevClassesMap[adjustment.zevClass];
    const modelYear = modelYearsMap[adjustment.modelYear];
    const numberOfUnits = adjustment.numberOfUnits;
    if (!type || !vehicleClass || !zevClass || !modelYear || !numberOfUnits) {
      throw new Error("Invalid adjustment detected!");
    }
    const numberOfUnitsDec = new Decimal(numberOfUnits);
    if (numberOfUnitsDec.lte(0) || numberOfUnitsDec.decimalPlaces() > 2) {
      throw new Error(
        "An adjustment's Number of Units must be greater than zero and must be rounded to no more than the second decimal place!",
      );
    }
    result.push({
      type,
      vehicleClass,
      zevClass,
      modelYear,
      numberOfUnits,
    });
  }
  return result;
};

export const generateMyr = async (
  template: Excel.Buffer,
  myrData: MyrData,
  zevClassOrdering: ZevClass[],
  legalName: string,
  makes: string,
  recordsAddress: string,
  serviceAddress: string,
  vehicleStatistics: VehicleStatString[],
  suggestedAdjustments: AdjustmentPayload[],
) => {
  const workbook = new Excel.Workbook();
  await workbook.xlsx.load(template);
  const sheets = getMyrSheets(workbook);
  const helpingMaps = getHelpingMaps();
  writeSupplierDetails(
    sheets.supplierDetailsSheet,
    legalName,
    makes,
    myrData.supplierClass,
    serviceAddress,
    recordsAddress,
    zevClassOrdering,
    helpingMaps,
  );
  writePreviousVolumes(
    sheets.previousVolumesSheet,
    myrData.volumes,
    helpingMaps,
  );
  writeVehicleStatistics(sheets.vehicleStatisticsSheet, vehicleStatistics);
  writeComplianceReductions(
    sheets.complianceReductionsSheet,
    myrData.complianceReductions,
    helpingMaps,
  );
  writeBalance(
    sheets.beginningBalanceSheet,
    myrData.prevEndingBalance,
    helpingMaps,
  );
  writeCredits(
    sheets.creditsSheet,
    myrData.currentTransactions,
    helpingMaps,
    new Set(),
  );
  writePendingSupplyCredits(
    sheets.pendingSupplyCreditsSheet,
    myrData.pendingSupplyCredits,
    helpingMaps,
  );
  writePreviousAdjustments(
    sheets.adjustmentsSheet,
    myrData.currentTransactions,
    helpingMaps,
  );
  writeAdjustments(
    sheets.suggestedAdjustmentsSheet,
    suggestedAdjustments,
    helpingMaps,
  );
  writeOffsetsAndTransfersAway(
    sheets.offsetsAndTransfersAwaySheet,
    myrData.offsets,
    myrData.currentTransactions,
    helpingMaps,
  );
  writeBalance(
    sheets.prelimEndingBalanceSheet,
    myrData.prelimEndingBalance,
    helpingMaps,
  );
  return workbook;
};

const writeSupplierDetails = (
  sheet: Excel.Worksheet,
  legalName: string,
  makes: string,
  classification: SupplierClass,
  serviceAddress: string,
  recordsAddress: string,
  zevClassOrdering: ZevClass[],
  helpingMaps: MyrHelpingMaps,
) => {
  sheet.addRow([
    legalName,
    makes,
    helpingMaps.supplierClassesMap[classification],
    serviceAddress,
    recordsAddress,
    zevClassOrdering
      .map((zevClass) => helpingMaps.zevClassesMap[zevClass])
      .join(", "),
  ]);
};

const writePreviousVolumes = (
  sheet: Excel.Worksheet,
  volumes: [ModelYear, VehicleClass, number][],
  helpingMaps: MyrHelpingMaps,
) => {
  for (const volume of volumes) {
    sheet.addRow([
      helpingMaps.modelYearsMap[volume[0]],
      helpingMaps.vehicleClassesMap[volume[1]],
      volume[2],
    ]);
  }
};

const writeVehicleStatistics = (
  sheet: Excel.Worksheet,
  vehicleStatistics: VehicleStatString[],
) => {
  for (const vehicle of vehicleStatistics) {
    sheet.addRow([
      vehicle.vehicleClass,
      vehicle.zevClass,
      vehicle.make,
      vehicle.modelName,
      vehicle.modelYear,
      vehicle.zevType,
      vehicle.range,
      vehicle.submittedCount,
      vehicle.issuedCount,
    ]);
  }
};

const writeBalance = (
  sheet: Excel.Worksheet,
  records: MyrEndingBalance,
  helpingMaps: MyrHelpingMaps,
) => {
  records.forEach((record) => {
    sheet.addRow([
      helpingMaps.transactionTypesMap[record.type],
      helpingMaps.vehicleClassesMap[record.vehicleClass],
      helpingMaps.zevClassesMap[record.zevClass],
      helpingMaps.modelYearsMap[record.modelYear],
      record.numberOfUnits,
    ]);
  });
};

const writeComplianceReductions = (
  sheet: Excel.Worksheet,
  records: MyrComplianceReductions,
  helpingMaps: MyrHelpingMaps,
) => {
  records.forEach((record) => {
    sheet.addRow([
      record.complianceRatio,
      record.nv,
      helpingMaps.vehicleClassesMap[record.vehicleClass],
      helpingMaps.zevClassesMap[record.zevClass],
      helpingMaps.modelYearsMap[record.modelYear],
      record.numberOfUnits,
    ]);
  });
};

const writeOffsetsAndTransfersAway = (
  sheet: Excel.Worksheet,
  offsets: MyrOffsets,
  currentTransactions: MyrCurrentTransactions,
  helpingMaps: MyrHelpingMaps,
) => {
  currentTransactions.forEach((record) => {
    if (record.type === TransactionType.TRANSFER_AWAY) {
      sheet.addRow([
        "Transfer Away",
        helpingMaps.vehicleClassesMap[record.vehicleClass],
        helpingMaps.zevClassesMap[record.zevClass],
        helpingMaps.modelYearsMap[record.modelYear],
        record.numberOfUnits,
      ]);
    }
  });
  offsets.forEach((record) => {
    sheet.addRow([
      "Offset",
      helpingMaps.vehicleClassesMap[record.vehicleClass],
      helpingMaps.zevClassesMap[record.zevClass],
      helpingMaps.modelYearsMap[record.modelYear],
      record.numberOfUnits,
    ]);
  });
};

const writeCredits = (
  sheet: Excel.Worksheet,
  records: MyrCurrentTransactions,
  helpingMaps: MyrHelpingMaps,
  referenceTypesToExclude: Set<ReferenceType>,
) => {
  records.forEach((record) => {
    if (
      record.type === TransactionType.CREDIT &&
      !referenceTypesToExclude.has(record.referenceType)
    ) {
      sheet.addRow([
        helpingMaps.referenceTypesMap[record.referenceType],
        helpingMaps.vehicleClassesMap[record.vehicleClass],
        helpingMaps.zevClassesMap[record.zevClass],
        helpingMaps.modelYearsMap[record.modelYear],
        record.numberOfUnits,
      ]);
    }
  });
};

const writePendingSupplyCredits = (
  sheet: Excel.Worksheet,
  records: UnitsAsString<ZevUnitRecord>[],
  helpingMaps: MyrHelpingMaps,
) => {
  for (const record of records) {
    sheet.addRow([
      helpingMaps.vehicleClassesMap[record.vehicleClass],
      helpingMaps.zevClassesMap[record.zevClass],
      helpingMaps.modelYearsMap[record.modelYear],
      record.numberOfUnits,
    ]);
  }
};

export const generateAssessment = async (
  template: Excel.Buffer,
  assessmentData: AssessmentData,
  modelYear: ModelYear,
  zevClassOrdering: ZevClass[],
  adjustments: AdjustmentPayload[],
) => {
  const workbook = new Excel.Workbook();
  await workbook.xlsx.load(template);
  const sheets = getAssessmentSheets(workbook);
  const helpingMaps = getHelpingMaps();
  writeAssessmentDetails(
    sheets.detailsSheet,
    assessmentData.supplierClass,
    assessmentData.complianceInfo,
    zevClassOrdering,
    helpingMaps,
  );
  writeComplianceReductions(
    sheets.complianceReductionsSheet,
    assessmentData.complianceReductions,
    helpingMaps,
  );
  writeBalance(
    sheets.beginningBalanceSheet,
    assessmentData.beginningBalance,
    helpingMaps,
  );
  writeCredits(
    sheets.creditsSheet,
    assessmentData.currentTransactions,
    helpingMaps,
    new Set([ReferenceType.ASSESSMENT_ADJUSTMENT]),
  );
  writePreviousAdjustments(
    sheets.previousAdjustmentsSheet,
    assessmentData.currentTransactions,
    helpingMaps,
  );
  writeAdjustments(sheets.currentAdjustmentsSheet, adjustments, helpingMaps);
  writeOffsetsAndTransfersAway(
    sheets.offsetsAndTransfersAwaySheet,
    assessmentData.offsets,
    assessmentData.currentTransactions,
    helpingMaps,
  );
  writeFinalEndingBalance(
    sheets.finalEndingBalanceSheet,
    modelYear,
    assessmentData.endingBalance,
    assessmentData.complianceInfo,
    helpingMaps,
  );
  writeComplianceStatements(
    sheets.statementsSheet,
    assessmentData.complianceInfo,
    helpingMaps,
  );
  return workbook;
};

const writeAssessmentDetails = (
  sheet: Excel.Worksheet,
  classification: SupplierClass,
  complianceInfo: ComplianceInfo,
  zevClassOrdering: ZevClass[],
  helpingMaps: MyrHelpingMaps,
) => {
  let isCompliant: IsCompliant = IsCompliant.Yes;
  for (const [_vehicleClass, data] of Object.values(complianceInfo)) {
    if (!data.isCompliant) {
      isCompliant = IsCompliant.No;
      break;
    }
  }
  sheet.addRow([
    helpingMaps.supplierClassesMap[classification],
    isCompliant,
    zevClassOrdering
      .map((zevClass) => helpingMaps.zevClassesMap[zevClass])
      .join(", "),
  ]);
};

const writeComplianceStatements = (
  sheet: Excel.Worksheet,
  complianceInfo: ComplianceInfo,
  helpingMaps: MyrHelpingMaps,
) => {
  Object.values(complianceInfo).forEach(([vehicleClassEnum, data]) => {
    const vehicleClass = helpingMaps.vehicleClassesMap[vehicleClassEnum];
    if (data.isCompliant) {
      sheet.addRow([
        `With respect to the ${vehicleClass} vehicle class, the supplier in question has complied with section 10 (2) of the Zero-Emission Vehicles Act.`,
      ]);
    } else {
      sheet.addRow([
        `With respect to the ${vehicleClass} vehicle class, the supplier in question has not complied with section 10 (2) of the Zero-Emission Vehicles Act.`,
      ]);
      const penalty = new Decimal(data.penalty);
      if (penalty.gt(0)) {
        sheet.addRow([
          `With respect to the ${vehicleClass} vehicle class, section 10 (3) of the Zero-Emission Vehicles Act applies to the supplier in question and they are required to pay a penalty amount of $${penalty.toString()}.`,
        ]);
      }
    }
  });
};

const writePreviousAdjustments = (
  sheet: Excel.Worksheet,
  records: MyrCurrentTransactions,
  helpingMaps: MyrHelpingMaps,
) => {
  for (const record of records) {
    if (record.referenceType === ReferenceType.ASSESSMENT_ADJUSTMENT) {
      sheet.addRow([
        helpingMaps.transactionTypesMap[record.type],
        helpingMaps.vehicleClassesMap[record.vehicleClass],
        helpingMaps.zevClassesMap[record.zevClass],
        helpingMaps.modelYearsMap[record.modelYear],
        record.numberOfUnits,
      ]);
    }
  }
};

const writeAdjustments = writeBalance;

const writeFinalEndingBalance = (
  sheet: Excel.Worksheet,
  modelYear: ModelYear,
  records: MyrEndingBalance,
  complianceInfo: ComplianceInfo,
  helpingMaps: MyrHelpingMaps,
) => {
  let hasPenalty = false;
  for (const [_vehicleClass, data] of Object.values(complianceInfo)) {
    const penaltyDec = new Decimal(data.penalty);
    if (penaltyDec.greaterThan(0)) {
      hasPenalty = true;
      break;
    }
  }
  records.forEach((record) => {
    const numberOfUnits = record.numberOfUnits;
    const divisor = divisors[modelYear];
    sheet.addRow([
      helpingMaps.transactionTypesMap[record.type],
      helpingMaps.vehicleClassesMap[record.vehicleClass],
      helpingMaps.zevClassesMap[record.zevClass],
      helpingMaps.modelYearsMap[record.modelYear],
      numberOfUnits,
      divisor && !hasPenalty ? divisor : "1",
      divisor && !hasPenalty
        ? new Decimal(numberOfUnits).div(new Decimal(divisor)).toFixed(2)
        : numberOfUnits,
    ]);
  });
};

export const getWorkbook = async (buffer: Excel.Buffer) => {
  const workbook = new Excel.Workbook();
  await workbook.xlsx.load(buffer);
  return workbook;
};

export const populateForecastTemplate = async (
  template: Excel.Buffer,
  modelYear: ModelYear,
) => {
  const workbook = await getWorkbook(template);
  const { zevSheet, nonZevSheet } = getForecastSheets(workbook);
  const nextThreeModelYears: string[] = getNextThreeModelYears(modelYear);
  for (let i = 2; i <= 2001; i++) {
    zevSheet.getCell(`A${i}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ['"' + nextThreeModelYears.join(",") + '"'],
    };
    zevSheet.getCell(`G${i}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ['"' + interiorVolumes.join(",") + '"'],
    };
  }
  nonZevSheet.getCell("A2").value = nextThreeModelYears[0];
  nonZevSheet.getCell("A3").value = nextThreeModelYears[1];
  nonZevSheet.getCell("A4").value = nextThreeModelYears[2];
  return workbook;
};

export const validateForecastReport = (
  workbook: Workbook,
  myrModelYear: ModelYear,
) => {
  const { zevSheet, nonZevSheet } = getForecastSheets(workbook);
  const nextThreeModelYears = getNextThreeModelYears(myrModelYear);
  const invalidRows: number[] = [];
  for (let i = 2; i <= 2001; i++) {
    const row = zevSheet.getRow(i);
    const modelYear = row.getCell(1).toString();
    const make = row.getCell(2).toString();
    const modelName = row.getCell(3).toString();
    const zevType = row.getCell(4).toString();
    const range = row.getCell(5).toString();
    const zevClass = row.getCell(6).toString();
    const interiorVolume = row.getCell(7).toString();
    const supplyForecast = row.getCell(8).toString();
    if (
      !modelYear &&
      !make &&
      !modelName &&
      !zevType &&
      !range &&
      !zevClass &&
      !interiorVolume &&
      !supplyForecast
    ) {
      continue;
    }
    if (
      modelYear &&
      make &&
      modelName &&
      zevType &&
      range &&
      zevClass &&
      interiorVolume &&
      supplyForecast &&
      nextThreeModelYears.includes(modelYear) &&
      !Number.isNaN(Number.parseInt(range, 10)) &&
      !Number.isNaN(Number.parseInt(supplyForecast, 10))
    ) {
      continue;
    } else {
      invalidRows.push(i);
    }
  }
  if (invalidRows.length > 0) {
    throw new Error(
      `In the ZEV Forecast sheet, the following rows have missing or invalid data: ${invalidRows.join(", ")}. Please refer to the instructions sheet for guidance.`,
    );
  }
  for (const cell of ["B2", "B3", "B4"]) {
    const value = nonZevSheet.getCell(cell).toString();
    if (!value || Number.isNaN(Number.parseInt(value, 10))) {
      throw new Error(
        `Missing or invalid value detected in the Non-ZEV Forecast sheet!`,
      );
    }
  }
};
