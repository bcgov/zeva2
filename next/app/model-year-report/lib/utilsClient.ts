import Excel from "exceljs";
import {
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
  MyrPrevEndingBalance,
  NvValues,
  SupplierData,
} from "./actions";
import { Decimal } from "@/prisma/generated/client/runtime/index-browser";
import { MyrTemplate } from "./constants";
import {
  getModelYearEnumsToStringsMap,
  getReferenceTypeEnumsToStringsMap,
  getTransactionTypeEnumsToStringMap,
  getVehicleClassEnumsToStringsMap,
  getZevClassEnumsToStringsMap,
} from "@/app/lib/utils/enumMaps";
import { downloadBuffer } from "@/app/lib/utils/download";

export type SupplierZevClassChoice = {
  [ZevClass.A]: typeof ZevClass.A;
  [ZevClass.B]: typeof ZevClass.B;
}[keyof {
  [ZevClass.A]: typeof ZevClass.A;
  [ZevClass.B]: typeof ZevClass.B;
}];

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
  referenceTypesMap: Partial<Record<ReferenceType, string>>;
  vehicleClassesMap: Partial<Record<VehicleClass, string>>;
  zevClassesMap: Partial<Record<ZevClass, string>>;
  modelYearsMap: Partial<Record<ModelYear, string>>;
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
    !supplierDetailsSheet ||
    !prevBalanceSheet ||
    !complianceReductionsSheet ||
    !priorityZevClassSheet ||
    !offsetsAndTransfersAwaySheet ||
    !creditsSheet
  ) {
    throw new Error("Invalid Template!");
  }
  const helpingMaps: MyrHelpingMaps = {
    transactionTypesMap: getTransactionTypeEnumsToStringMap(),
    referenceTypesMap: getReferenceTypeEnumsToStringsMap(),
    vehicleClassesMap: getVehicleClassEnumsToStringsMap(),
    zevClassesMap: getZevClassEnumsToStringsMap(),
    modelYearsMap: getModelYearEnumsToStringsMap(),
  };
  writeSupplierDetails(supplierDetailsSheet, myrData.supplierData);
  writePrevBalance(prevBalanceSheet, myrData.prevEndingBalance, helpingMaps);
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
  writeCredits(creditsSheet, myrData.currentTransactions, helpingMaps);
  const fileName = `myr-${orgName.replaceAll(" ", "-")}-${helpingMaps.modelYearsMap[modelYear]}.xlsx`;
  const buffer = await workbook.xlsx.writeBuffer();
  downloadBuffer(fileName, buffer);
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

const writePrevBalance = (
  sheet: Excel.Worksheet,
  records: MyrPrevEndingBalance,
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
) => {
  records.forEach((record) => {
    if (record.type === TransactionType.CREDIT) {
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
