import {
  VehicleClass,
  TransactionType,
  ZevClass,
  ModelYear,
  ZevUnitEndingBalance,
  ZevUnitTransaction,
} from "@/prisma/generated/client";
import { Decimal } from "@/prisma/generated/client/runtime/library";
import {
  vehicleClasses,
  zevClasses,
  modelYears,
  specialZevClasses,
  otherZevClasses,
} from "@/lib/constants/zevUnit";

interface ZevUnitRecordBase {
  numberOfUnits: Decimal;
  vehicleClass: VehicleClass;
  zevClass: ZevClass;
  modelYear: ModelYear;
  type: TransactionType;
}

type ZevUnitTransactionSparse = Partial<
  Omit<ZevUnitTransaction, keyof ZevUnitRecordBase>
>;
type ZevUnitEndingBalanceSparse = Partial<
  Omit<ZevUnitEndingBalance, keyof ZevUnitRecordBase>
>;

// both ZevUnitTransactions and ZevUnitEndingBalances can be of type ZevUnitRecord;
// a ZevUnitEndingBalance will need to be modified slightly
// (its finalNumberOfUnits value will need to be copied over to a numberOfUnits field)
export interface ZevUnitRecord
  extends ZevUnitTransactionSparse,
    ZevUnitEndingBalanceSparse,
    ZevUnitRecordBase {}

// a structure of ZevUnitRecords that may prove useful for rendering purposes
export type ZevUnitRecordsObj = Partial<
  Record<
    TransactionType,
    Partial<
      Record<
        VehicleClass,
        Partial<Record<ZevClass, Partial<Record<ModelYear, Decimal>>>>
      >
    >
  >
>;

// custom errors:
export class UnexpectedDebit extends Error {}
export class UncoveredTransfer extends Error {}
export class IncompleteOrdering extends Error {}

// to be used when generating a supplier's MYR/Supplementary/Assessment/Reassessment;
// inputed zevUnitRecords should consist of:
// (1) the supplier's ending balance records with compliance year N (if any exist), and
// (2) the supplier's transactions with a timestamp associated with year N+1, and
// (3) the supplier's obligation reductions/adjustments associated with year N+1;
// also, zevClassesOrdered should be a total ordering of zevClasses derived from the supplier's recorded preference
export const calculateBalance = (
  zevUnitRecords: ZevUnitRecord[],
  zevClassesOrdered: ZevClass[],
) => {
  let refinedRecords = applyTransfersAway(zevUnitRecords);
  const balanceBeforeOffsets = getSummedZevUnitRecordsObj(refinedRecords);
  refinedRecords = offsetSpecialDebits(refinedRecords);
  refinedRecords = offsetUnspecifiedDebits(refinedRecords, zevClassesOrdered);
  refinedRecords = offsetOtherDebitsWithUnspecifiedCredits(refinedRecords);
  refinedRecords = offsetOtherDebitsWithMatchingCredits(refinedRecords);
  return {
    balanceBeforeOffsets: balanceBeforeOffsets,
    finalBalance: getSummedZevUnitRecordsObj(refinedRecords),
  };
};

// for use when not generating a MYR/Supplementary/Assessment/Reassessment
// if there exists a debit amongst transactions, this is an error (it implies we got the wrong balance)
// else if there exists debit amongst endingBalances, return "deficit"
// else, collect ending balances and transactions into a list of ZevUnitRecords, apply transfers away, and return the result
export const getBalance = (
  endingBalances: ZevUnitEndingBalance[],
  transactions: ZevUnitTransaction[],
) => {
  for (const transaction of transactions) {
    if (transaction.type === TransactionType.DEBIT) {
      throw new UnexpectedDebit();
    }
  }
  for (const balance of endingBalances) {
    if (balance.type === TransactionType.DEBIT) {
      return "deficit";
    }
  }
  const zevUnitRecords = getZevUnitRecords(endingBalances).concat(transactions);
  const recordsAfterTransfersAway = applyTransfersAway(zevUnitRecords);
  return getSummedZevUnitRecordsObj(recordsAfterTransfersAway);
};

export const getZevUnitRecords = (
  endingBalances: ZevUnitEndingBalance[],
): ZevUnitRecord[] => {
  const result = [];
  for (const balance of endingBalances) {
    const record = { ...balance, numberOfUnits: balance.finalNumberOfUnits };
    result.push(record);
  }
  return result;
};

// this function must not mutate the inputed zevUnitRecords
export const getSummedZevUnitRecordsObj = (
  zevUnitRecords: ZevUnitRecord[],
): ZevUnitRecordsObj => {
  const result: ZevUnitRecordsObj = {};
  for (const record of zevUnitRecords) {
    const recordType = record.type;
    const vehicleClass = record.vehicleClass;
    const zevClass = record.zevClass;
    const modelYear = record.modelYear;
    const numberOfUnits = record.numberOfUnits;
    if (!result[recordType]) {
      result[recordType] = {};
    }
    if (!result[recordType][vehicleClass]) {
      result[recordType][vehicleClass] = {};
    }
    if (!result[recordType][vehicleClass][zevClass]) {
      result[recordType][vehicleClass][zevClass] = {};
    }
    const currentNumberOfUnits =
      result[recordType][vehicleClass][zevClass][modelYear];
    if (!currentNumberOfUnits) {
      result[recordType][vehicleClass][zevClass][modelYear] = numberOfUnits;
    } else {
      result[recordType][vehicleClass][zevClass][modelYear] =
        currentNumberOfUnits.plus(numberOfUnits);
    }
  }
  return result;
};

// a transfer away is not a debit subject to section 12 offsetting rules;
// e.g. if a supplier has 1 (REPORTABLE, A, 2020) credit and 1 (REPORTABLE, A, 2021) credit,
// and they transfer away the latter, their final balance is 1 (REPORTABLE, A, 2020) credit,
// not 1 (REPORTABLE, A, 2021) credit as it would be had we applied section 12(3)
// throws an UncoveredTransfer error if there exists a transfer away in zevUnitRecords not
// coverable by credits in zevUnitRecords
export const applyTransfersAway = (zevUnitRecords: ZevUnitRecord[]) => {
  const result = [];
  type ZevUnitsMap = Partial<
    Record<
      VehicleClass,
      Partial<Record<ZevClass, Partial<Record<ModelYear, ZevUnitRecord[]>>>>
    >
  >;
  const creditsMap: ZevUnitsMap = {};
  const transfersAwayMap: ZevUnitsMap = {};

  for (const record of zevUnitRecords) {
    let map = null;
    const recordType = record.type;
    const vehicleClass = record.vehicleClass;
    const zevClass = record.zevClass;
    const modelYear = record.modelYear;
    if (recordType === TransactionType.CREDIT) {
      map = creditsMap;
    } else if (recordType === TransactionType.TRANSFER_AWAY) {
      map = transfersAwayMap;
    }
    if (map) {
      if (!map[vehicleClass]) {
        map[vehicleClass] = {};
      }
      if (!map[vehicleClass][zevClass]) {
        map[vehicleClass][zevClass] = {};
      }
      if (!map[vehicleClass][zevClass][modelYear]) {
        map[vehicleClass][zevClass][modelYear] = [];
      }
      map[vehicleClass][zevClass][modelYear].push(record);
    } else {
      result.push(record);
    }
  }

  for (const vehicleClass of vehicleClasses) {
    for (const zevClass of zevClasses) {
      for (const modelYear of modelYears) {
        const credits = creditsMap[vehicleClass]?.[zevClass]?.[modelYear] ?? [];
        const transfersAway =
          transfersAwayMap[vehicleClass]?.[zevClass]?.[modelYear] ?? [];
        const offsettedRecords = offset(credits, transfersAway);
        result.push(...offsettedRecords);
      }
    }
  }

  for (const record of result) {
    if (record.type === TransactionType.TRANSFER_AWAY) {
      throw new UncoveredTransfer();
    }
  }
  return result;
};

// section 12(2)(a)
export const offsetSpecialDebits = (zevUnitRecords: ZevUnitRecord[]) => {
  return offsetCertainDebitsBySameZevClass(zevUnitRecords, specialZevClasses);
};

// section 12(2)(b)
export const offsetUnspecifiedDebits = (
  zevUnitRecords: ZevUnitRecord[],
  zevClassesOrdered: ZevClass[],
) => {
  const zevClassesSet = new Set(zevClassesOrdered);
  const isTotallyOrdered = zevClasses.every((zevClass) =>
    zevClassesSet.has(zevClass),
  );
  if (!isTotallyOrdered) {
    throw new IncompleteOrdering();
  }
  const result = [];
  type ZevUnitsMap = Partial<
    Record<VehicleClass, Partial<Record<ZevClass, ZevUnitRecord[]>>>
  >;
  type UnspecifiedDebitsMap = Partial<Record<VehicleClass, ZevUnitRecord[]>>;
  const creditsMap: ZevUnitsMap = {};
  const debitsMap: UnspecifiedDebitsMap = {};

  for (const record of zevUnitRecords) {
    const recordType = record.type;
    const vehicleClass = record.vehicleClass;
    const zevClass = record.zevClass;
    if (recordType === TransactionType.CREDIT) {
      if (!creditsMap[vehicleClass]) {
        creditsMap[vehicleClass] = {};
      }
      if (!creditsMap[vehicleClass][zevClass]) {
        creditsMap[vehicleClass][zevClass] = [];
      }
      creditsMap[vehicleClass][zevClass].push(record);
    } else if (
      recordType === TransactionType.DEBIT &&
      zevClass === ZevClass.UNSPECIFIED
    ) {
      if (!debitsMap[vehicleClass]) {
        debitsMap[vehicleClass] = [];
      }
      debitsMap[vehicleClass].push(record);
    } else {
      result.push(record);
    }
  }

  for (const subMap of Object.values(creditsMap)) {
    for (const credits of Object.values(subMap)) {
      sortByModelYear(credits);
    }
  }
  for (const debits of Object.values(debitsMap)) {
    sortByModelYear(debits);
  }
  for (const vehicleClass of vehicleClasses) {
    const creditsByVehicleClass = [];
    const debits = debitsMap[vehicleClass] ?? [];
    for (const zevClass of zevClassesOrdered) {
      const credits = creditsMap[vehicleClass]?.[zevClass] ?? [];
      creditsByVehicleClass.push(...credits);
    }
    const offsettedRecords = offset(creditsByVehicleClass, debits);
    result.push(...offsettedRecords);
  }
  return result;
};

// section 12(2)(c)(i)
export const offsetOtherDebitsWithUnspecifiedCredits = (
  zevUnitRecords: ZevUnitRecord[],
) => {
  const result = [];
  type ZevUnitsMap = Partial<Record<VehicleClass, ZevUnitRecord[]>>;
  const creditsMap: ZevUnitsMap = {};
  const debitsMap: ZevUnitsMap = {};

  for (const record of zevUnitRecords) {
    let map = null;
    const recordType = record.type;
    const vehicleClass = record.vehicleClass;
    const zevClass = record.zevClass;
    if (
      recordType === TransactionType.CREDIT &&
      zevClass === ZevClass.UNSPECIFIED
    ) {
      map = creditsMap;
    } else if (
      recordType === TransactionType.DEBIT &&
      otherZevClasses.some((otherClass) => zevClass === otherClass)
    ) {
      map = debitsMap;
    }
    if (map) {
      if (!map[vehicleClass]) {
        map[vehicleClass] = [];
      }
      map[vehicleClass].push(record);
    } else {
      result.push(record);
    }
  }

  for (const map of [creditsMap, debitsMap]) {
    for (const records of Object.values(map)) {
      sortByModelYear(records);
    }
  }
  for (const vehicleClass of vehicleClasses) {
    const credits = creditsMap[vehicleClass] ?? [];
    const debits = debitsMap[vehicleClass] ?? [];
    const offsettedRecords = offset(credits, debits);
    result.push(...offsettedRecords);
  }
  return result;
};

// section 12(2)(c)(ii)
export const offsetOtherDebitsWithMatchingCredits = (
  zevUnitRecords: ZevUnitRecord[],
) => {
  return offsetCertainDebitsBySameZevClass(zevUnitRecords, otherZevClasses);
};

const offsetCertainDebitsBySameZevClass = (
  zevUnitRecords: ZevUnitRecord[],
  debitZevClasses: ZevClass[],
) => {
  const result = [];
  type ZevUnitsMap = Partial<
    Record<VehicleClass, Partial<Record<ZevClass, ZevUnitRecord[]>>>
  >;
  const creditsMap: ZevUnitsMap = {};
  const debitsMap: ZevUnitsMap = {};

  for (const record of zevUnitRecords) {
    let map = null;
    const recordType = record.type;
    const vehicleClass = record.vehicleClass;
    const zevClass = record.zevClass;
    if (recordType === TransactionType.CREDIT) {
      map = creditsMap;
    } else if (recordType === TransactionType.DEBIT) {
      map = debitsMap;
    }
    if (map && debitZevClasses.some((zevClass) => zevClass === zevClass)) {
      if (!map[vehicleClass]) {
        map[vehicleClass] = {};
      }
      if (!map[vehicleClass][zevClass]) {
        map[vehicleClass][zevClass] = [];
      }
      map[vehicleClass][zevClass].push(record);
    } else {
      result.push(record);
    }
  }

  for (const map of [creditsMap, debitsMap]) {
    for (const subMap of Object.values(map)) {
      for (const zevUnitRecords of Object.values(subMap)) {
        sortByModelYear(zevUnitRecords);
      }
    }
  }
  for (const vehicleClass of vehicleClasses) {
    for (const zevClass of debitZevClasses) {
      const credits = creditsMap[vehicleClass]?.[zevClass] ?? [];
      const debits = debitsMap[vehicleClass]?.[zevClass] ?? [];
      const offsettedRecords = offset(credits, debits);
      result.push(...offsettedRecords);
    }
  }
  return result;
};

const offset = (
  credits: ZevUnitRecord[],
  debits: ZevUnitRecord[],
): ZevUnitRecord[] => {
  const creditSeries = getSeries(credits);
  const debitSeries = getSeries(debits);
  const creditSeriesLength = creditSeries.length;
  const debitSeriesLength = debitSeries.length;
  if (creditSeriesLength === 0) {
    return debits;
  }
  if (debitSeriesLength === 0) {
    return credits;
  }
  const creditSeriesLastElement = creditSeries[creditSeriesLength - 1];
  const debitSeriesLastElement = debitSeries[debitSeriesLength - 1];
  let lesserElement = null;
  let greaterSeqAndSeries: [ZevUnitRecord[], Decimal[]] | null = null;
  if (creditSeriesLastElement.lessThan(debitSeriesLastElement)) {
    lesserElement = creditSeriesLastElement;
    greaterSeqAndSeries = [debits, debitSeries];
  } else if (debitSeriesLastElement.lessThan(creditSeriesLastElement)) {
    lesserElement = debitSeriesLastElement;
    greaterSeqAndSeries = [credits, creditSeries];
  }
  if (lesserElement && greaterSeqAndSeries) {
    const sequence = greaterSeqAndSeries[0];
    const series = greaterSeqAndSeries[1];
    for (const [index, term] of series.entries()) {
      if (lesserElement.lessThan(term)) {
        const diff = term.minus(lesserElement);
        const remainsOfRecord = { ...sequence[index], numberOfUnits: diff };
        return [remainsOfRecord].concat(sequence.slice(index + 1));
      }
    }
  }
  return [];
};

const getSeries = (records: ZevUnitRecord[]): Decimal[] => {
  const result: Decimal[] = [];
  for (const [index, record] of records.entries()) {
    const numberOfUnits = record.numberOfUnits;
    if (index === 0) {
      result.push(numberOfUnits);
    } else {
      result.push(result[index - 1].add(numberOfUnits));
    }
  }
  return result;
};

const sortByModelYear = (zevUnitRecords: ZevUnitRecord[]) => {
  zevUnitRecords.sort((a, b) => {
    if (a.modelYear < b.modelYear) {
      return -1;
    }
    if (a.modelYear > b.modelYear) {
      return 1;
    }
    return 0;
  });
};
