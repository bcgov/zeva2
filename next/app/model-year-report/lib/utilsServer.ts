import { Decimal } from "decimal.js";
import {
  BalanceType,
  ModelYear,
  ReassessmentStatus,
  ReferenceType,
  SupplementaryReportStatus,
  SupplierClass,
  TransactionType,
  VehicleClass,
  ZevClass,
} from "@/prisma/generated/enums";
import { SortOrderInput } from "@/prisma/generated/commonInputTypes";
import { AdjustmentPayload, NvValues } from "./actions";
import {
  specialComplianceRatios,
  unspecifiedComplianceRatios,
} from "@/app/lib/constants/complianceRatio";
import {
  applyTransfersAway,
  getSpecialZevClassPairs,
  UnexpectedDebit,
  ZevUnitRecord,
} from "@/lib/utils/zevUnit";
import {
  IsCompliant,
  mapOfStatusToSupplierStatus,
  MyrRecord,
  MyrRecordSerialized,
} from "./constants";
import { penaltyRates } from "@/app/lib/constants/penaltyRate";
import { isVehicleClass, isZevClass } from "@/app/lib/utils/typeGuards";
import {
  getStringsToBalanceTypeEnumsMap,
  getStringsToModelYearsEnumsMap,
  getStringsToSupplierClassEnumsMap,
  getStringsToVehicleClassEnumsMap,
  getStringsToZevClassEnumsMap,
} from "@/app/lib/utils/enumMaps";
import { randomUUID } from "crypto";
import { Workbook } from "exceljs";
import {
  FileFinalEndingBalanceRecord,
  FileReductionRecord,
  FileZevUnitRecord,
  parseAssessment,
} from "./utils";
import { Directory } from "@/app/lib/services/s3";

export const validatePrevBalanceTransactions = (
  transactions: ZevUnitRecord[],
) => {
  transactions.forEach((transaction) => {
    if (transaction.type === TransactionType.DEBIT) {
      throw new UnexpectedDebit(
        "Unexpected debit when collecting previous balance!",
      );
    }
  });
  return applyTransfersAway(transactions);
};

export type ComplianceReduction = ZevUnitRecord & {
  complianceRatio: string;
  nv: string;
};

export const getReduction = (
  complianceRatio: string,
  nv: string,
  vehicleClass: VehicleClass,
  zevClass: ZevClass,
  modelYear: ModelYear,
): ComplianceReduction => {
  const product = new Decimal(complianceRatio).times(new Decimal(nv));
  const numberOfUnits = product.toDecimalPlaces(2);
  return {
    complianceRatio,
    nv,
    type: TransactionType.DEBIT,
    vehicleClass,
    zevClass,
    modelYear,
    numberOfUnits,
  };
};

export const getComplianceRatioReductions = (
  nvValues: NvValues,
  modelYear: ModelYear,
  supplierClass: SupplierClass,
): ComplianceReduction[] => {
  const result: ComplianceReduction[] = [];
  if (supplierClass === SupplierClass.SMALL_VOLUME_SUPPLIER) {
    Object.entries(nvValues).forEach(([vehicleClass, nv]) => {
      if (isVehicleClass(vehicleClass)) {
        result.push(
          getReduction("0", nv, vehicleClass, ZevClass.UNSPECIFIED, modelYear),
        );
      }
    });
    return result;
  }
  Object.entries(nvValues).forEach(([vehicleClass, nv]) => {
    if (isVehicleClass(vehicleClass)) {
      const unspecifiedRatio =
        unspecifiedComplianceRatios[vehicleClass]?.[modelYear];
      if (!unspecifiedRatio) {
        throw new Error("Unspecified Compliance Ratio not found!");
      }
      const unspecifiedReduction = getReduction(
        unspecifiedRatio,
        nv,
        vehicleClass,
        ZevClass.UNSPECIFIED,
        modelYear,
      );
      if (
        supplierClass === SupplierClass.LARGE_VOLUME_SUPPLIER ||
        (supplierClass === SupplierClass.MEDIUM_VOLUME_SUPPLIER &&
          modelYear >= ModelYear.MY_2026)
      ) {
        const specialReductions: ComplianceReduction[] = [];
        Object.entries(specialComplianceRatios).forEach(
          ([specialVehicleClass, subMap]) => {
            if (vehicleClass === specialVehicleClass) {
              Object.entries(subMap).forEach(([specialZevClass, subSubMap]) => {
                if (isZevClass(specialZevClass)) {
                  const specialRatio = subSubMap[modelYear];
                  if (specialRatio) {
                    const specialReduction = getReduction(
                      specialRatio,
                      nv,
                      specialVehicleClass,
                      specialZevClass,
                      modelYear,
                    );
                    unspecifiedReduction.numberOfUnits =
                      unspecifiedReduction.numberOfUnits.minus(
                        specialReduction.numberOfUnits,
                      );
                    specialReductions.push(specialReduction);
                  }
                }
              });
            }
          },
        );
        result.push(...specialReductions, unspecifiedReduction);
      } else {
        result.push(unspecifiedReduction);
      }
    }
  });
  return result;
};

export const getTransformedAdjustments = (
  adjustments: AdjustmentPayload[],
): ZevUnitRecord[] => {
  return adjustments.map((adjustment) => {
    return {
      ...adjustment,
      numberOfUnits: new Decimal(adjustment.numberOfUnits),
    };
  });
};

export type UnitsAsString<T extends ZevUnitRecord> = Omit<
  T,
  "numberOfUnits"
> & { numberOfUnits: string };

export const getSerializedMyrRecords = <T extends ZevUnitRecord>(
  records: T[],
): UnitsAsString<T>[] => {
  return records.map((record) => {
    return {
      ...record,
      numberOfUnits: record.numberOfUnits.toString(),
    };
  });
};

export const getSerializedMyrRecordsExcludeKey = <
  T extends ZevUnitRecord,
  K extends keyof T,
>(
  records: T[],
  keyToExclude: K,
): Omit<UnitsAsString<T>, K>[] => {
  const serializedRecords = getSerializedMyrRecords<T>(records);
  return serializedRecords.map((record) => {
    const { [keyToExclude]: excludedKey, ...rest } = record;
    return rest;
  });
};

export const getZevUnitRecordsOrderByClause = (): [
  { type: SortOrderInput["sort"] },
  { vehicleClass: SortOrderInput["sort"] },
  { zevClass: SortOrderInput["sort"] },
  { modelYear: SortOrderInput["sort"] },
] => {
  return [
    { type: "asc" },
    {
      vehicleClass: "asc",
    },
    {
      zevClass: "asc",
    },
    {
      modelYear: "asc",
    },
  ];
};

export const getReportFullObjectName = (
  type: "myr" | "forecast" | "assessment" | "reassessment" | "supplementary",
): string => {
  const objectName = randomUUID();
  switch (type) {
    case "myr":
      return `${Directory.ModelYearReport}/${objectName}`;
    case "forecast":
      return `${Directory.Forecast}/${objectName}`;
    case "assessment":
      return `${Directory.Assessment}/${objectName}`;
    case "reassessment":
      return `${Directory.Reassessment}/${objectName}`;
    case "supplementary":
      return `${Directory.Supplementary}/${objectName}`;
  }
};

export type ComplianceInfo = Record<
  VehicleClass,
  [
    VehicleClass,
    {
      isCompliant: boolean;
      penalty: string;
    },
  ]
>;

export const getComplianceInfo = (
  supplierClass: SupplierClass,
  modelYear: ModelYear,
  prevEndingBalance: ZevUnitRecord[],
  endingBalance: ZevUnitRecord[],
): ComplianceInfo => {
  const result: ComplianceInfo = {
    [VehicleClass.REPORTABLE]: [
      VehicleClass.REPORTABLE,
      {
        isCompliant: true,
        penalty: "0",
      },
    ],
  };
  const specialZevClassPairs = getSpecialZevClassPairs();
  const complianceMap: Record<
    VehicleClass,
    [
      VehicleClass,
      {
        hasNonZeroCredit: boolean;
        hasNonZeroDebit: boolean;
        hasNonZeroSpecialDebit: boolean;
      },
    ]
  > = {
    [VehicleClass.REPORTABLE]: [
      VehicleClass.REPORTABLE,
      {
        hasNonZeroCredit: false,
        hasNonZeroDebit: false,
        hasNonZeroSpecialDebit: false,
      },
    ],
  };
  for (const record of endingBalance) {
    const vehicleClass = record.vehicleClass;
    if (
      record.type === TransactionType.DEBIT &&
      !record.numberOfUnits.equals(0)
    ) {
      complianceMap[vehicleClass][1].hasNonZeroDebit = true;
      if (
        record.vehicleClass === VehicleClass.REPORTABLE &&
        specialZevClassPairs.some(
          ([pairVehicleClass, pairZevClass]) =>
            record.vehicleClass === pairVehicleClass &&
            record.zevClass === pairZevClass,
        )
      ) {
        complianceMap[vehicleClass][1].hasNonZeroSpecialDebit = true;
      }
    } else if (
      record.type === TransactionType.CREDIT &&
      !record.numberOfUnits.equals(0)
    ) {
      complianceMap[vehicleClass][1].hasNonZeroCredit = true;
    }
  }
  Object.values(complianceMap).forEach(([vehicleClass, complianceData]) => {
    const hasNonZeroSpecialDebit = complianceData.hasNonZeroSpecialDebit;
    const hasNonZeroDebit = complianceData.hasNonZeroDebit;
    const hasNonZeroCredit = complianceData.hasNonZeroCredit;
    if (
      hasNonZeroSpecialDebit &&
      (supplierClass === SupplierClass.LARGE_VOLUME_SUPPLIER ||
        (supplierClass === SupplierClass.MEDIUM_VOLUME_SUPPLIER &&
          modelYear >= ModelYear.MY_2026))
    ) {
      result[vehicleClass][1].isCompliant = false;
      result[vehicleClass][1].penalty = getPenalty(
        modelYear,
        prevEndingBalance,
        endingBalance,
      );
    } else if (
      supplierClass !== SupplierClass.SMALL_VOLUME_SUPPLIER &&
      hasNonZeroDebit &&
      !hasNonZeroCredit
    ) {
      result[vehicleClass][1].isCompliant = false;
      result[vehicleClass][1].penalty = getPenalty(
        modelYear,
        prevEndingBalance,
        endingBalance,
      );
    }
  });
  return result;
};

export const getPenalty = (
  modelYear: ModelYear,
  prevBalance: ZevUnitRecord[],
  currentBalance: ZevUnitRecord[],
): string => {
  let penalty: Decimal = new Decimal(0);
  const prevDebitVehicleClasses = new Set<VehicleClass>();
  const penaltyRate = penaltyRates[modelYear];
  prevBalance.forEach((record) => {
    if (
      record.type === TransactionType.DEBIT &&
      !record.numberOfUnits.equals(0)
    ) {
      prevDebitVehicleClasses.add(record.vehicleClass);
    }
  });
  if (prevDebitVehicleClasses.size === 0) {
    return "0";
  }
  currentBalance.forEach((record) => {
    if (
      record.type === TransactionType.DEBIT &&
      !record.numberOfUnits.equals(0) &&
      prevDebitVehicleClasses.has(record.vehicleClass)
    ) {
      if (penaltyRate) {
        penalty = penalty.plus(record.numberOfUnits.times(penaltyRate));
      } else {
        throw new Error("Penalty rate not found!");
      }
    }
  });
  return penalty.toFixed(2);
};

// assumes reassessments and supplementaryReports are ordered by sequence number (greatest -> least)
export const getSerializedMyrs = (
  myrs: MyrRecord[],
  userIsGov: boolean,
): MyrRecordSerialized[] => {
  return myrs.map((myr) => {
    const { organization, reassessments, supplementaryReports, ...result } =
      myr;
    if (!userIsGov) {
      result.status = mapOfStatusToSupplierStatus[result.status];
    }
    let reassessmentStatus: ReassessmentStatus | null = null;
    let supplementaryReportStatus: SupplementaryReportStatus | null = null;
    if (
      !userIsGov &&
      reassessments.length > 0 &&
      reassessments[0].status === ReassessmentStatus.ISSUED
    ) {
      reassessmentStatus = ReassessmentStatus.ISSUED;
    } else if (
      userIsGov &&
      supplementaryReports.length > 0 &&
      supplementaryReports[0].status === SupplementaryReportStatus.SUBMITTED
    ) {
      supplementaryReportStatus = SupplementaryReportStatus.SUBMITTED;
    }
    return {
      ...result,
      orgName: organization.name,
      reassessmentStatus,
      supplementaryReportStatus,
    };
  });
};

type DataFromParsedReduction = {
  nvValues: [VehicleClass, Decimal][];
  reductions: ZevUnitRecord[];
};

const parseReductionsForData = (
  complianceReductions: FileReductionRecord[],
): DataFromParsedReduction => {
  const result: DataFromParsedReduction = {
    nvValues: [],
    reductions: [],
  };
  const vehicleClassesMap = getStringsToVehicleClassEnumsMap();
  const zevClassesMap = getStringsToZevClassEnumsMap();
  const modelYearsMap = getStringsToModelYearsEnumsMap();
  const error = new Error("Error parsing reductions!");
  complianceReductions.forEach((cr) => {
    const nv = cr.nv;
    const vehicleClass = vehicleClassesMap[cr.vehicleClass];
    const zevClass = zevClassesMap[cr.zevClass];
    const modelYear = modelYearsMap[cr.modelYear];
    if (!nv || !vehicleClass || !zevClass || !modelYear) {
      throw error;
    }
    try {
      const nvDec = new Decimal(nv);
      if (!nvDec.isInteger()) {
        throw new Error();
      }
      const pair = result.nvValues.find(
        ([elementVehicleClass]) => elementVehicleClass === vehicleClass,
      );
      if (pair && !pair[1].equals(nvDec)) {
        throw new Error();
      }
      if (!pair) {
        result.nvValues.push([vehicleClass, nvDec]);
      }
      result.reductions.push({
        type: TransactionType.DEBIT,
        vehicleClass,
        zevClass,
        modelYear,
        numberOfUnits: new Decimal(cr.numberOfUnits),
      });
    } catch (e) {
      throw error;
    }
  });
  return result;
};

const parseFileZevUnitRecordsForData = (
  record: Omit<FileZevUnitRecord, "numberOfUnits">,
): Omit<ZevUnitRecord, "numberOfUnits"> => {
  const typesMap = getStringsToBalanceTypeEnumsMap();
  const vehicleClassesMap = getStringsToVehicleClassEnumsMap();
  const zevClassesMap = getStringsToZevClassEnumsMap();
  const modelYearsMap = getStringsToModelYearsEnumsMap();
  const type = typesMap[record.type];
  const vehicleClass = vehicleClassesMap[record.vehicleClass];
  const zevClass = zevClassesMap[record.zevClass];
  const modelYear = modelYearsMap[record.modelYear];
  if (!type || !vehicleClass || !zevClass || !modelYear) {
    throw new Error("Error parsing ZEV unit record!");
  }
  return {
    type,
    vehicleClass,
    zevClass,
    modelYear,
  };
};

const parseAdjustmentForData = (records: FileZevUnitRecord[]) => {
  const result: ZevUnitRecord[] = [];
  records.forEach((record) => {
    const parsedRecord = parseFileZevUnitRecordsForData(record);
    try {
      const numberOfUnits = new Decimal(record.numberOfUnits);
      result.push({ ...parsedRecord, numberOfUnits });
    } catch (e) {
      throw new Error("Error parsing adjustment!");
    }
  });
  return result;
};

const parseFinalEndingBalanceForData = (
  records: FileFinalEndingBalanceRecord[],
) => {
  const result: (Omit<ZevUnitRecord, "numberOfUnits"> & {
    initialNumberOfUnits: Decimal;
    finalNumberOfUnits: Decimal;
  })[] = [];
  records.forEach((record) => {
    const parsedRecord = parseFileZevUnitRecordsForData(record);
    try {
      const initialNumberOfUnits = new Decimal(record.initialNumberOfUnits);
      const finalNumberOfUnits = new Decimal(record.finalNumberOfUnits);
      result.push({
        ...parsedRecord,
        initialNumberOfUnits,
        finalNumberOfUnits,
      });
    } catch (e) {
      throw new Error("Error parsing final ending balance record!");
    }
  });
  return result;
};

export const parseAssesmentForData = (
  workbook: Workbook,
): {
  nvValues: [VehicleClass, number][];
  transactions: (ZevUnitRecord & { referenceType: ReferenceType })[];
  endingBalance: (Omit<ZevUnitRecord, "type" | "numberOfUnits"> & {
    type: BalanceType;
    initialNumberOfUnits: Decimal;
    finalNumberOfUnits: Decimal;
  })[];
  compliant: boolean;
  supplierClass: SupplierClass;
  reportableNvValue: number;
} => {
  const parsedAssessment = parseAssessment(workbook);
  const reductions = parsedAssessment.complianceReductions;
  const currentAdjustments = parsedAssessment.currentAdjustments;
  const finalEndingBalance = parsedAssessment.finalEndingBalance;
  const reductionsData = parseReductionsForData(reductions);
  const reductionTransactions = reductionsData.reductions.map((reduction) => {
    return {
      ...reduction,
      referenceType: ReferenceType.COMPLIANCE_RATIO_REDUCTION,
    };
  });
  const adjustmentsData = parseAdjustmentForData(currentAdjustments);
  const adjustmentTransactions = adjustmentsData.map((adjustment) => {
    return {
      ...adjustment,
      referenceType: ReferenceType.ASSESSMENT_ADJUSTMENT,
    };
  });
  const nvValues: [VehicleClass, number][] = reductionsData.nvValues.map(
    ([vehicleClass, nv]) => [vehicleClass, nv.toNumber()],
  );
  const transactions = [...reductionTransactions, ...adjustmentTransactions];
  const finalEndingBalanceData =
    parseFinalEndingBalanceForData(finalEndingBalance);
  const endingBalance = finalEndingBalanceData.map((record) => {
    const type = record.type;
    if (type !== BalanceType.CREDIT && type !== BalanceType.DEBIT) {
      throw new Error("Error parsing assessment data!");
    }
    return {
      type,
      vehicleClass: record.vehicleClass,
      zevClass: record.zevClass,
      modelYear: record.modelYear,
      initialNumberOfUnits: record.initialNumberOfUnits,
      finalNumberOfUnits: record.finalNumberOfUnits,
    };
  });
  let compliant: boolean | null = null;
  const isCompliant = parsedAssessment.details.isCompliant;
  if (isCompliant === IsCompliant.No) {
    compliant = false;
  } else if (isCompliant === IsCompliant.Yes) {
    compliant = true;
  }
  const supplierClassesMap = getStringsToSupplierClassEnumsMap();
  const supplierClass =
    supplierClassesMap[parsedAssessment.details.classification];
  const reportableNvValue = nvValues.find(
    ([vehicleClass, nvValue]) => vehicleClass === VehicleClass.REPORTABLE,
  );
  if (compliant === null || !supplierClass || !reportableNvValue) {
    throw new Error("Error parsing assessment data!");
  }
  return {
    nvValues,
    transactions,
    endingBalance,
    compliant,
    supplierClass,
    reportableNvValue: reportableNvValue[1],
  };
};
