import Excel from "exceljs";
import {
  BalanceType,
  ModelYear,
  ReferenceType,
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
  AssessmentPayload,
} from "./actions";
import { Decimal } from "@/prisma/generated/client/runtime/index-browser";
import {
  AssessmentTemplate,
  divisors,
  MyrTemplate,
  SupplierZevClassChoice,
} from "./constants";
import {
  getBalanceTypeEnumsToStringsMap,
  getModelYearEnumsToStringsMap,
  getReferenceTypeEnumsToStringsMap,
  getStringsToBalanceTypeEnumsMap,
  getStringsToModelYearsEnumsMap,
  getStringsToReferenceTypeEnumsMap,
  getStringsToTransactionTypeEnumsMap,
  getStringsToVehicleClassEnumsMap,
  getStringsToZevClassEnumsMap,
  getTransactionTypeEnumsToStringMap,
  getVehicleClassEnumsToStringsMap,
  getZevClassEnumsToStringsMap,
} from "@/app/lib/utils/enumMaps";
import { downloadBuffer } from "@/app/lib/utils/download";
import { Adjustment } from "./components/Adjustments";
import {
  isModelYear,
  isTransactionType,
  isVehicleClass,
  isZevClass,
} from "@/app/lib/utils/typeGuards";
import { SupplierClass } from "@/app/lib/constants/complianceRatio";
import { ComplianceInfo } from "./utils";
import { AssessmentResultData } from "./components/AssessmentResult";

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
    const valueDecimal = new Decimal(value);
    if (!valueDecimal.isInteger()) {
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
};

export type InverseHelpingMaps = {
  transactionTypesMap: Partial<Record<string, TransactionType>>;
  balanceTypesMap: Partial<Record<string, BalanceType>>;
  referenceTypesMap: Partial<Record<string, ReferenceType>>;
  vehicleClassesMap: Partial<Record<string, VehicleClass>>;
  zevClassesMap: Partial<Record<string, ZevClass>>;
  modelYearsMap: Partial<Record<string, ModelYear>>;
};

export const getHelpingMaps = (): MyrHelpingMaps => {
  return {
    transactionTypesMap: getTransactionTypeEnumsToStringMap(),
    balanceTypesMap: getBalanceTypeEnumsToStringsMap(),
    referenceTypesMap: getReferenceTypeEnumsToStringsMap(),
    vehicleClassesMap: getVehicleClassEnumsToStringsMap(),
    zevClassesMap: getZevClassEnumsToStringsMap(),
    modelYearsMap: getModelYearEnumsToStringsMap(),
  };
};

export const getInverseHelpingMaps = (): InverseHelpingMaps => {
  return {
    transactionTypesMap: getStringsToTransactionTypeEnumsMap(),
    balanceTypesMap: getStringsToBalanceTypeEnumsMap(),
    referenceTypesMap: getStringsToReferenceTypeEnumsMap(),
    vehicleClassesMap: getStringsToVehicleClassEnumsMap(),
    zevClassesMap: getStringsToZevClassEnumsMap(),
    modelYearsMap: getStringsToModelYearsEnumsMap(),
  };
};

export const downloadMyr = async (
  template: Excel.Buffer,
  myrData: MyrData,
  priorityZevClass: SupplierZevClassChoice,
  orgName: string,
  modelYear: ModelYear,
) => {
  const workbook = new Excel.Workbook();
  await workbook.xlsx.load(template);
  const modelYearSheet = workbook.getWorksheet(MyrTemplate.ModelYearSheetName);
  const supplierDetailsSheet = workbook.getWorksheet(
    MyrTemplate.SupplierDetailsSheetName,
  );
  const prevBalanceSheet = workbook.getWorksheet(
    MyrTemplate.PrevBalanceSheetName,
  );
  const complianceReductionsSheet = workbook.getWorksheet(
    MyrTemplate.ComplianceReductionsSheetName,
  );
  const priorityZevClassSheet = workbook.getWorksheet(
    MyrTemplate.PriorityZevClassSheetName,
  );
  const offsetsAndTransfersAwaySheet = workbook.getWorksheet(
    MyrTemplate.OffsetsAndTransfersAwaySheetName,
  );
  const creditsSheet = workbook.getWorksheet(MyrTemplate.CreditsSheetName);
  if (
    !modelYearSheet ||
    !supplierDetailsSheet ||
    !prevBalanceSheet ||
    !complianceReductionsSheet ||
    !priorityZevClassSheet ||
    !offsetsAndTransfersAwaySheet ||
    !creditsSheet
  ) {
    throw new Error("Invalid Template!");
  }
  const helpingMaps = getHelpingMaps();
  writeModelYear(modelYearSheet, modelYear, helpingMaps);
  writeSupplierDetails(supplierDetailsSheet, myrData.supplierData);
  writeBalance(prevBalanceSheet, myrData.prevEndingBalance, helpingMaps);
  writeComplianceReductions(
    complianceReductionsSheet,
    myrData.complianceReductions,
    helpingMaps,
  );
  writePriorityZevClass(priorityZevClassSheet, priorityZevClass);
  writeOffsetsAndTransfersAway(
    offsetsAndTransfersAwaySheet,
    myrData.offsets,
    myrData.currentTransactions,
    helpingMaps,
  );
  writeCredits(
    creditsSheet,
    myrData.currentTransactions,
    helpingMaps,
    new Set(),
  );
  const fileName = `myr-${orgName.replaceAll(" ", "-")}-${helpingMaps.modelYearsMap[modelYear]}.xlsx`;
  const buffer = await workbook.xlsx.writeBuffer();
  downloadBuffer(fileName, buffer);
};

const writeModelYear = (
  sheet: Excel.Worksheet,
  modelYear: ModelYear,
  helpingMaps: MyrHelpingMaps,
) => {
  sheet.addRow([helpingMaps.modelYearsMap[modelYear]]);
};

const writeSupplierDetails = (
  sheet: Excel.Worksheet,
  supplierDetails: SupplierData,
) => {
  const { name, makes, recordsAddress, serviceAddress, supplierClass } =
    supplierDetails;
  sheet.addRow([
    name,
    makes.join(", "),
    supplierClass,
    serviceAddress
      ? `${serviceAddress.addressLines}, ${serviceAddress.city}, ${serviceAddress.state}, ${serviceAddress.postalCode}, ${serviceAddress.country}`
      : "",
    recordsAddress
      ? `${recordsAddress.addressLines}, ${recordsAddress.city}, ${recordsAddress.state}, ${recordsAddress.postalCode}, ${recordsAddress.country}`
      : "",
  ]);
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

const writePriorityZevClass = (
  sheet: Excel.Worksheet,
  priorityZevClass: SupplierZevClassChoice,
) => {
  sheet.addRow([priorityZevClass]);
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
        record.referenceId,
        record.legacyReferenceId,
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
      "",
      "",
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
        record.referenceId,
        record.legacyReferenceId,
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

export const downloadAssessment = async (
  template: Excel.Buffer,
  assessmentData: AssessmentData,
  priorityZevClass: SupplierZevClassChoice,
  adjustments: AdjustmentPayload[],
  orgName: string,
  modelYear: ModelYear,
  isReassessment: boolean,
) => {
  const workbook = new Excel.Workbook();
  await workbook.xlsx.load(template);
  const detailsSheet = workbook.getWorksheet(
    AssessmentTemplate.DetailsSheetName,
  );
  const reductionsSheet = workbook.getWorksheet(
    AssessmentTemplate.ComplianceReductionsSheetName,
  );
  const complianceStatementSheet = workbook.getWorksheet(
    AssessmentTemplate.ComplianceStatementSheetName,
  );
  const endingBalanceSheet = workbook.getWorksheet(
    AssessmentTemplate.EndingBalanceSheetName,
  );
  const offsetsAndTransfersAwaySheet = workbook.getWorksheet(
    AssessmentTemplate.OffsetsAndTransfersAwaySheetName,
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
  const penaltySheet = workbook.getWorksheet(
    AssessmentTemplate.PenaltySheetName,
  );
  if (
    !detailsSheet ||
    !reductionsSheet ||
    !complianceStatementSheet ||
    !endingBalanceSheet ||
    !offsetsAndTransfersAwaySheet ||
    !creditsSheet ||
    !previousAdjustmentsSheet ||
    !currentAdjustmentsSheet ||
    !penaltySheet
  ) {
    throw new Error("Invalid Template!");
  }
  const helpingMaps = getHelpingMaps();
  writeAssessmentDetails(
    detailsSheet,
    orgName,
    modelYear,
    assessmentData.supplierClass,
    priorityZevClass,
    helpingMaps,
  );
  writeComplianceReductions(
    reductionsSheet,
    assessmentData.complianceReductions,
    helpingMaps,
  );
  writeComplianceStatement(
    complianceStatementSheet,
    orgName,
    assessmentData.complianceInfo,
  );
  writeBalance(endingBalanceSheet, assessmentData.endingBalance, helpingMaps);
  writeOffsetsAndTransfersAway(
    offsetsAndTransfersAwaySheet,
    assessmentData.offsets,
    assessmentData.currentTransactions,
    helpingMaps,
  );
  writeCredits(
    creditsSheet,
    assessmentData.currentTransactions,
    helpingMaps,
    new Set([ReferenceType.ASSESSMENT_ADJUSTMENT]),
  );
  writePreviousAdjustments(
    previousAdjustmentsSheet,
    assessmentData.currentTransactions,
    helpingMaps,
  );
  writeAdjustments(currentAdjustmentsSheet, adjustments, helpingMaps);
  writePenalty(penaltySheet, assessmentData.complianceInfo, orgName);
  const fileName = `${isReassessment ? "re" : ""}assessment-${orgName.replaceAll(" ", "-")}-${helpingMaps.modelYearsMap[modelYear]}.xlsx`;
  const buffer = await workbook.xlsx.writeBuffer();
  downloadBuffer(fileName, buffer);
};

const writeAssessmentDetails = (
  sheet: Excel.Worksheet,
  supplierName: string,
  modelYear: ModelYear,
  classification: SupplierClass,
  priorityZevClass: SupplierZevClassChoice,
  helpingMaps: MyrHelpingMaps,
) => {
  sheet.addRow([
    supplierName,
    helpingMaps.modelYearsMap[modelYear],
    classification,
    priorityZevClass,
  ]);
};

const writeComplianceStatement = (
  sheet: Excel.Worksheet,
  orgName: string,
  complianceInfo: ComplianceInfo,
) => {
  if (complianceInfo.isCompliant) {
    sheet.addRow([
      `${orgName} has complied with section 10 (2) of the Zero-Emission Vehicles Act.`,
    ]);
  } else {
    sheet.addRow([
      `${orgName} has not complied with section 10 (2) of the Zero-Emission Vehicles Act.`,
    ]);
  }
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

const writePenalty = (
  sheet: Excel.Worksheet,
  complianceInfo: ComplianceInfo,
  orgName: string,
) => {
  const penalty = new Decimal(complianceInfo.penalty);
  if (!complianceInfo.isCompliant && penalty.gt(0)) {
    sheet.addRow([
      `Section 10 (3) of the Zero-Emission Vehicles Act applies to ${orgName} and they are required to pay a penalty amount of $${penalty.toString()}.`,
    ]);
  }
};

export const parseAssessment = async (
  file: ArrayBuffer,
  modelYear: ModelYear,
): Promise<AssessmentResultData> => {
  let nv: string | undefined;
  const transactions: Partial<Record<string, string>>[] = [];
  const endingBalance: Partial<Record<string, string>>[] = [];
  const workbook = new Excel.Workbook();
  await workbook.xlsx.load(file);
  const reductionsSheet = workbook.getWorksheet(
    AssessmentTemplate.ComplianceReductionsSheetName,
  );
  const currentAdjustmentsSheet = workbook.getWorksheet(
    AssessmentTemplate.CurrentAdjustmentsSheetName,
  );
  const endingBalanceSheet = workbook.getWorksheet(
    AssessmentTemplate.EndingBalanceSheetName,
  );
  const penaltySheet = workbook.getWorksheet(
    AssessmentTemplate.PenaltySheetName,
  );
  if (
    !reductionsSheet ||
    !currentAdjustmentsSheet ||
    !endingBalanceSheet ||
    !penaltySheet
  ) {
    throw new Error("Invalid assessment file!");
  }
  const transactionTypesMap = getTransactionTypeEnumsToStringMap();
  const referenceTypesMap = getReferenceTypeEnumsToStringsMap();
  const vehicleClassesMap = getVehicleClassEnumsToStringsMap();
  reductionsSheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      const vehicleClass = row.getCell(3).toString();
      if (vehicleClass === vehicleClassesMap[VehicleClass.REPORTABLE]) {
        nv = row.getCell(2).toString();
      }
      transactions.push({
        type: transactionTypesMap[TransactionType.DEBIT],
        referenceType: referenceTypesMap[ReferenceType.OBLIGATION_REDUCTION],
        vehicleClass,
        zevClass: row.getCell(4).toString(),
        modelYear: row.getCell(5).toString(),
        numberOfUnits: row.getCell(6).toString(),
      });
    }
  });
  currentAdjustmentsSheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      transactions.push({
        type: row.getCell(1).toString(),
        referenceType: referenceTypesMap[ReferenceType.ASSESSMENT_ADJUSTMENT],
        vehicleClass: row.getCell(2).toString(),
        zevClass: row.getCell(3).toString(),
        modelYear: row.getCell(4).toString(),
        numberOfUnits: row.getCell(5).toString(),
      });
    }
  });
  const hasPenalty = penaltySheet.actualRowCount > 0;
  endingBalanceSheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      const record: Record<string, string> = {
        type: row.getCell(1).toString(),
        vehicleClass: row.getCell(2).toString(),
        zevClass: row.getCell(3).toString(),
        modelYear: row.getCell(4).toString(),
        initialNumberOfUnits: row.getCell(5).toString(),
      };
      if (hasPenalty) {
        record.divisor = "1";
        record.finalNumberOfUnits = record.initialNumberOfUnits;
      } else {
        record.divisor = divisors[modelYear] ?? "1";
        record.finalNumberOfUnits = new Decimal(record.initialNumberOfUnits)
          .div(new Decimal(record.divisor))
          .toFixed(2);
      }
      endingBalance.push(record);
    }
  });
  return {
    nv,
    transactions,
    endingBalance,
  };
};

export const getAssessmentPayload = (
  data: AssessmentResultData,
): AssessmentPayload => {
  if (!data.nv) {
    throw new Error("NV not found!");
  }
  if (data.endingBalance.length === 0) {
    throw new Error("Ending balance not found!");
  }
  try {
    const nvDec = new Decimal(data.nv);
    if (!nvDec.isInteger()) {
      throw new Error();
    }
  } catch (e) {
    throw new Error("NV must be an integer!");
  }
  const helpingMaps = getInverseHelpingMaps();
  const transactions: AssessmentPayload["transactions"] = data.transactions.map(
    (transaction) => {
      return getTransactionPayload(transaction, helpingMaps);
    },
  );
  const endingBalance: AssessmentPayload["endingBalance"] =
    data.endingBalance.map((record) => {
      return getBalanceRecordPayload(record, helpingMaps);
    });
  return {
    nv: new Decimal(data.nv).toNumber(),
    transactions,
    endingBalance,
  };
};

export const getTransactionPayload = (
  transaction: Partial<Record<string, string>>,
  helpingMaps: InverseHelpingMaps,
) => {
  const error = new Error("Error getting transaction payload!");
  if (
    !transaction.type ||
    !transaction.referenceType ||
    !transaction.vehicleClass ||
    !transaction.zevClass ||
    !transaction.modelYear ||
    !transaction.numberOfUnits
  ) {
    throw error;
  }
  const type = helpingMaps.transactionTypesMap[transaction.type];
  const referenceType =
    helpingMaps.referenceTypesMap[transaction.referenceType];
  const vehicleClass = helpingMaps.vehicleClassesMap[transaction.vehicleClass];
  const zevClass = helpingMaps.zevClassesMap[transaction.zevClass];
  const modelYear = helpingMaps.modelYearsMap[transaction.modelYear];
  if (!type || !referenceType || !vehicleClass || !zevClass || !modelYear) {
    throw error;
  }
  try {
    const unitsDec = new Decimal(transaction.numberOfUnits);
    if (unitsDec.decimalPlaces() > 2) {
      throw new Error();
    }
    return {
      type,
      referenceType,
      vehicleClass,
      zevClass,
      modelYear,
      numberOfUnits: unitsDec.toString(),
    };
  } catch (e) {
    throw error;
  }
};

export const getBalanceRecordPayload = (
  record: Partial<Record<string, string>>,
  helpingMaps: InverseHelpingMaps,
) => {
  const error = new Error("Error getting balance payload!");
  if (
    !record.type ||
    !record.vehicleClass ||
    !record.zevClass ||
    !record.modelYear ||
    !record.initialNumberOfUnits ||
    !record.finalNumberOfUnits
  ) {
    throw error;
  }
  const type = helpingMaps.balanceTypesMap[record.type];
  const vehicleClass = helpingMaps.vehicleClassesMap[record.vehicleClass];
  const zevClass = helpingMaps.zevClassesMap[record.zevClass];
  const modelYear = helpingMaps.modelYearsMap[record.modelYear];
  if (!type || !vehicleClass || !zevClass || !modelYear) {
    throw error;
  }
  try {
    const initialUnitsDec = new Decimal(record.initialNumberOfUnits);
    const finalUnitsDec = new Decimal(record.finalNumberOfUnits);
    if (
      initialUnitsDec.decimalPlaces() > 2 ||
      finalUnitsDec.decimalPlaces() > 2
    ) {
      throw new Error();
    }
    return {
      type,
      vehicleClass,
      zevClass,
      modelYear,
      initialNumberOfUnits: initialUnitsDec.toString(),
      finalNumberOfUnits: finalUnitsDec.toString(),
    };
  } catch (e) {
    throw error;
  }
};
