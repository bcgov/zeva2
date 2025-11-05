// do not import, directly or indirectly, any Prisma versions of Decimal here!

import Excel, { Workbook } from "exceljs";
import { MyrTemplate } from "./constants";

export type ParsedMyr = {
  modelYear: string;
  zevClassOrdering: string;
  supplierDetails: Partial<Record<string, string>>;
  complianceReductions: Partial<Record<string, string>>[];
  prevBalance: Partial<Record<string, string>>[];
  credits: Partial<Record<string, string>>[];
  offsetsAndTransfersAway: Partial<Record<string, string>>[];
  prelimEndingBalance: Partial<Record<string, string>>[];
};

export const parseMyr = (workbook: Workbook): ParsedMyr => {
  const modelYearSheet = workbook.getWorksheet(MyrTemplate.ModelYearSheetName);
  const zevClassOrderingSheet = workbook.getWorksheet(
    MyrTemplate.ZevClassOrderingSheetName,
  );
  const supplierDetailsSheet = workbook.getWorksheet(
    MyrTemplate.SupplierDetailsSheetName,
  );
  const complianceReductionsSheet = workbook.getWorksheet(
    MyrTemplate.ComplianceReductionsSheetName,
  );
  const prevBalanceSheet = workbook.getWorksheet(
    MyrTemplate.PrevBalanceSheetName,
  );
  const creditsSheet = workbook.getWorksheet(MyrTemplate.CreditsSheetName);
  const offsetsAndTransfersAwaySheet = workbook.getWorksheet(
    MyrTemplate.OffsetsAndTransfersAwaySheetName,
  );
  const prelimEndingBalanceSheet = workbook.getWorksheet(
    MyrTemplate.PreliminaryEndingBalance,
  );
  if (
    !modelYearSheet ||
    !zevClassOrderingSheet ||
    !supplierDetailsSheet ||
    !complianceReductionsSheet ||
    !prevBalanceSheet ||
    !creditsSheet ||
    !offsetsAndTransfersAwaySheet ||
    !prelimEndingBalanceSheet
  ) {
    throw new Error("Invalid model year report!");
  }
  return {
    modelYear: parseModelYear(modelYearSheet),
    zevClassOrdering: parseZevClassOrdering(zevClassOrderingSheet),
    supplierDetails: parseSupplierDetails(supplierDetailsSheet),
    complianceReductions: parseComplianceReductions(complianceReductionsSheet),
    prevBalance: parseZevUnitRecords(prevBalanceSheet),
    credits: parseZevUnitRecords(creditsSheet),
    offsetsAndTransfersAway: parseZevUnitRecords(offsetsAndTransfersAwaySheet),
    prelimEndingBalance: parseZevUnitRecords(prelimEndingBalanceSheet),
  };
};

const parseModelYear = (sheet: Excel.Worksheet): string => {
  return sheet.getRow(1).getCell(1).toString();
};

const parseZevClassOrdering = (sheet: Excel.Worksheet): string => {
  return sheet.getRow(1).getCell(1).toString();
};

const parseSupplierDetails = (
  sheet: Excel.Worksheet,
): Partial<Record<string, string>> => {
  const supplierDetailsRow = sheet.getRow(2);
  return {
    legalName: supplierDetailsRow.getCell(1).toString(),
    makes: supplierDetailsRow.getCell(2).toString(),
    classification: supplierDetailsRow.getCell(3).toString(),
    serviceAddress: supplierDetailsRow.getCell(4).toString(),
    recordsAddress: supplierDetailsRow.getCell(5).toString(),
  };
};

const parseComplianceReductions = (
  sheet: Excel.Worksheet,
): Partial<Record<string, string>>[] => {
  const result: Partial<Record<string, string>>[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      result.push({
        complianceRatio: row.getCell(1).toString(),
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

const parseZevUnitRecords = (
  sheet: Excel.Worksheet,
): Partial<Record<string, string>>[] => {
  const result: Partial<Record<string, string>>[] = [];
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
