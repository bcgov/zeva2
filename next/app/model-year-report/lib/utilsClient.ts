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
  SupplierData,
  AdjustmentPayload,
  AssessmentData,
} from "./actions";
import { divisors, IsCompliant, SupplierZevClassChoice } from "./constants";
import {
  getBalanceTypeEnumsToStringsMap,
  getModelYearEnumsToStringsMap,
  getReferenceTypeEnumsToStringsMap,
  getSupplierClassEnumsToStringsMap,
  getTransactionTypeEnumsToStringMap,
  getVehicleClassEnumsToStringsMap,
  getZevClassEnumsToStringsMap,
  lowerCaseAndCapitalize,
} from "@/app/lib/utils/enumMaps";
import { Adjustment } from "./components/Adjustments";
import {
  isModelYear,
  isTransactionType,
  isVehicleClass,
  isZevClass,
} from "@/app/lib/utils/typeGuards";
import { ComplianceInfo } from "./utilsServer";
import { getAssessmentSheets, getMyrSheets } from "./utils";
import { VehicleStatistics } from "./services";

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

export const generateMyr = async (template: Excel.Buffer, myrData: MyrData) => {
  const workbook = new Excel.Workbook();
  await workbook.xlsx.load(template);
  const sheets = getMyrSheets(workbook);
  const helpingMaps = getHelpingMaps();
  writeMyrDetails(
    sheets.detailsSheet,
    myrData.modelYear,
    myrData.zevClassOrdering,
    helpingMaps,
  );
  writeSupplierDetails(
    sheets.supplierDetailsSheet,
    myrData.supplierData,
    helpingMaps,
  );
  writeVehicleStatistics(
    sheets.vehicleStatisticsSheet,
    myrData.vehicleStatistics,
    helpingMaps,
  );
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

const writeMyrDetails = (
  sheet: Excel.Worksheet,
  modelYear: ModelYear,
  zevClassOrdering: ZevClass[],
  helpingMaps: MyrHelpingMaps,
) => {
  const finalOrdering = zevClassOrdering.map(
    (zevClass) => helpingMaps.zevClassesMap[zevClass],
  );
  sheet.addRow([
    helpingMaps.modelYearsMap[modelYear],
    finalOrdering.join(", "),
  ]);
};

const writeSupplierDetails = (
  sheet: Excel.Worksheet,
  supplierDetails: SupplierData,
  helpingMaps: MyrHelpingMaps,
) => {
  const { name, makes, recordsAddress, serviceAddress, supplierClass } =
    supplierDetails;
  sheet.addRow([
    name,
    makes.join(", "),
    helpingMaps.supplierClassesMap[supplierClass],
    serviceAddress
      ? `${serviceAddress.addressLines}, ${serviceAddress.city}, ${serviceAddress.state}, ${serviceAddress.postalCode}, ${serviceAddress.country}`
      : "",
    recordsAddress
      ? `${recordsAddress.addressLines}, ${recordsAddress.city}, ${recordsAddress.state}, ${recordsAddress.postalCode}, ${recordsAddress.country}`
      : "",
  ]);
};

const writeVehicleStatistics = (
  sheet: Excel.Worksheet,
  vehicleStatistics: VehicleStatistics,
  helpingMaps: MyrHelpingMaps,
) => {
  for (const vehicle of vehicleStatistics) {
    sheet.addRow([
      helpingMaps.vehicleClassesMap[vehicle.vehicleClass],
      helpingMaps.zevClassesMap[vehicle.zevClass],
      vehicle.make,
      vehicle.modelName,
      helpingMaps.modelYearsMap[vehicle.modelYear],
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

export const getAdjustmentsPayload = (
  adjustments: Adjustment[],
): AdjustmentPayload[] => {
  const result: AdjustmentPayload[] = [];
  adjustments.forEach((adjustment) => {
    const type = adjustment.type;
    const vehicleClass = adjustment.vehicleClass;
    const zevClass = adjustment.zevClass;
    const modelYear = adjustment.modelYear;
    const numberOfUnits = adjustment.numberOfUnits;
    if (
      !type ||
      !vehicleClass ||
      !zevClass ||
      !modelYear ||
      !numberOfUnits ||
      !isTransactionType(type) ||
      !isVehicleClass(vehicleClass) ||
      !isZevClass(zevClass) ||
      !isModelYear(modelYear)
    ) {
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
  });
  return result;
};

export const generateAssessment = async (
  template: Excel.Buffer,
  assessmentData: AssessmentData,
  adjustments: AdjustmentPayload[],
) => {
  const workbook = new Excel.Workbook();
  await workbook.xlsx.load(template);
  const sheets = getAssessmentSheets(workbook);
  const helpingMaps = getHelpingMaps();
  writeAssessmentDetails(
    sheets.detailsSheet,
    assessmentData.orgName,
    assessmentData.modelYear,
    assessmentData.supplierClass,
    assessmentData.zevClassOrdering,
    assessmentData.complianceInfo,
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
    assessmentData.modelYear,
    assessmentData.endingBalance,
    assessmentData.complianceInfo,
    helpingMaps,
  );
  writeComplianceStatements(
    sheets.statementsSheet,
    assessmentData.orgName,
    assessmentData.complianceInfo,
    helpingMaps,
  );
  return workbook;
};

const writeAssessmentDetails = (
  sheet: Excel.Worksheet,
  supplierName: string,
  modelYear: ModelYear,
  classification: SupplierClass,
  zevClassOrdering: ZevClass[],
  complianceInfo: ComplianceInfo,
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
    supplierName,
    helpingMaps.modelYearsMap[modelYear],
    helpingMaps.supplierClassesMap[classification],
    zevClassOrdering
      .map((zevClass) => helpingMaps.zevClassesMap[zevClass])
      .join(", "),
    isCompliant,
  ]);
};

const writeComplianceStatements = (
  sheet: Excel.Worksheet,
  orgName: string,
  complianceInfo: ComplianceInfo,
  helpingMaps: MyrHelpingMaps,
) => {
  Object.values(complianceInfo).forEach(([vehicleClassEnum, data]) => {
    const vehicleClass = helpingMaps.vehicleClassesMap[vehicleClassEnum];
    if (data.isCompliant) {
      sheet.addRow([
        `With respect to the ${vehicleClass} vehicle class, ${orgName} has complied with section 10 (2) of the Zero-Emission Vehicles Act.`,
      ]);
    } else {
      sheet.addRow([
        `With respect to the ${vehicleClass} vehicle class, ${orgName} has not complied with section 10 (2) of the Zero-Emission Vehicles Act.`,
      ]);
      const penalty = new Decimal(data.penalty);
      if (penalty.gt(0)) {
        sheet.addRow([
          `With respect to the ${vehicleClass} vehicle class, section 10 (3) of the Zero-Emission Vehicles Act applies to ${orgName} and they are required to pay a penalty amount of $${penalty.toString()}.`,
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
  records.forEach((record) => {
    if (record.referenceType === ReferenceType.ASSESSMENT_ADJUSTMENT) {
      sheet.addRow([
        helpingMaps.transactionTypesMap[record.type],
        helpingMaps.vehicleClassesMap[record.vehicleClass],
        helpingMaps.zevClassesMap[record.zevClass],
        helpingMaps.modelYearsMap[record.modelYear],
        record.numberOfUnits,
      ]);
    }
  });
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

export const validateForecastReport = (workbook: Workbook) => {
  //todo
};
