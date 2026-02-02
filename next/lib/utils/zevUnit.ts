import {
  VehicleClass,
  TransactionType,
  ZevClass,
  ModelYear,
  ZevUnitEndingBalance,
  ZevUnitTransaction,
} from "@/prisma/generated/client";
import { Decimal } from "@/prisma/generated/client/runtime/library";
import { getCompliancePeriod } from "../../app/lib/utils/complianceYear";
import {
  isModelYear,
  isTransactionType,
  isVehicleClass,
  isZevClass,
} from "@/app/lib/utils/typeGuards";
import { specialComplianceRatios } from "@/app/lib/constants/complianceRatio";
import { supplierZevClasses } from "@/app/model-year-report/lib/constants";

// both ZevUnitTransactions and ZevUnitEndingBalances can be of type ZevUnitRecord;
// a ZevUnitEndingBalance will need to be modified slightly
// (its finalNumberOfUnits value will need to be copied over to a numberOfUnits field)
export type ZevUnitRecord = {
  numberOfUnits: Decimal;
  vehicleClass: VehicleClass;
  zevClass: ZevClass;
  modelYear: ModelYear;
  type: TransactionType;
};

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

// to satisfy reporting requirements (sections 17(5)(c)(i), 19(1)(b), 19(1)(c))
// inputed zevUnitRecords should consist of:
// (1) the supplier's ending balance records with compliance year N (if any exist), and
// (2) the supplier's transactions with a timestamp associated with year N+1, and
// (3) the supplier's obligation reductions/adjustments associated with year N+1;
// zevClassesOrdered should be a total ordering of zevClasses derived from the supplier's recorded preference
// model year should be the reported model year
// returns [balance, creditsThatWereOffset]
export const calculateBalance = (
  zevUnitRecords: ZevUnitRecord[],
  zevClassesOrdered: ZevClass[],
  modelYear: ModelYear,
): [ZevUnitRecord[], ZevUnitRecord[]] => {
  let refinedRecords = applyTransfersAway(zevUnitRecords);
  let creditsThatWereOffsetBySpecialDebits: ZevUnitRecord[] = [];
  let creditsThatWereOffsetByUnspecifiedDebits: ZevUnitRecord[] = [];
  let unspecifiedCreditsThatWereOffsetByOtherDebits: ZevUnitRecord[] = [];
  let matchingCreditsThatWereOffsetByOtherDebits: ZevUnitRecord[] = [];
  [refinedRecords, creditsThatWereOffsetBySpecialDebits] =
    offsetSpecialDebits(refinedRecords);
  [refinedRecords, creditsThatWereOffsetByUnspecifiedDebits] =
    offsetUnspecifiedDebits(refinedRecords, zevClassesOrdered);
  [refinedRecords, unspecifiedCreditsThatWereOffsetByOtherDebits] =
    offsetOtherDebitsWithUnspecifiedCredits(refinedRecords);
  [refinedRecords, matchingCreditsThatWereOffsetByOtherDebits] =
    offsetOtherDebitsWithMatchingCredits(refinedRecords);
  let balance = flattenZevUnitRecords(refinedRecords);
  if (balance.length === 0) {
    Object.values(VehicleClass).forEach((vehicleClass) => {
      Object.values(supplierZevClasses).forEach((zevClass) => {
        balance.push({
          type: TransactionType.CREDIT,
          vehicleClass,
          zevClass,
          modelYear,
          numberOfUnits: new Decimal(0),
        });
      });
    });
  }
  return [
    balance,
    flattenZevUnitRecords([
      ...creditsThatWereOffsetBySpecialDebits,
      ...creditsThatWereOffsetByUnspecifiedDebits,
      ...unspecifiedCreditsThatWereOffsetByOtherDebits,
      ...matchingCreditsThatWereOffsetByOtherDebits,
    ]),
  ];
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
  const zevUnitRecords = getZevUnitRecords(endingBalances).concat(transactions);
  const recordsAfterTransfersAway = applyTransfersAway(zevUnitRecords);
  for (const balance of endingBalances) {
    if (balance.type === TransactionType.DEBIT) {
      return "deficit";
    }
  }
  return getSummedZevUnitRecordsObj(recordsAfterTransfersAway);
};

/**
 * This funcion calls getBalance()
 * with the ending balances filtered to only containig records of the final compliance year, and
 * with the transactions filtered to only containing records with timestamp after end of
 * the final compliance year.
 * @param endingBalances - All ending balance records for the supplier.
 * @param transactions - All transaction records for the supplier.
 * @returns a ZevUnitRecordsObj containing the ZEV unit balances, or the string "deficit" if
 * the supplier has a deficit.
 */
export const getCurrentBalance = (
  endingBalances: ZevUnitEndingBalance[],
  transactions: ZevUnitTransaction[],
) => {
  let finalComplianceYear: ModelYear | undefined;
  for (const balance of endingBalances) {
    if (
      finalComplianceYear === undefined ||
      balance.complianceYear > finalComplianceYear
    ) {
      finalComplianceYear = balance.complianceYear;
    }
  }
  if (!finalComplianceYear) {
    return getBalance(endingBalances, transactions);
  }

  const finalYearEndingBalances = endingBalances.filter(
    (balance) => balance.complianceYear === finalComplianceYear,
  );
  const finalYearEnd = getCompliancePeriod(finalComplianceYear).openUpperBound;
  const finalTransactions = transactions.filter(
    (transaction) => transaction.timestamp >= finalYearEnd,
  );

  return getBalance(finalYearEndingBalances, finalTransactions);
};

/**
 * This function sums the balances of a specific transaction type, vehicle class, and zev class.
 * @param balances - a ZevUnitRecordsObj containing all the ZEV unit balances
 * @param transactionType - the transaction type of the balances to be summed
 * @param vehicleClass - the vehicle class of the balances to be summed
 * @param zevClass - the zev class of the balances to be summed
 * @returns the sum of the balances of the specified transaction type, vehicle class, and zev class
 */
export const sumBalance = (
  balances: ZevUnitRecordsObj,
  transactionType: TransactionType,
  vehicleClass: VehicleClass,
  zevClass: ZevClass,
) => {
  const filteredBalance =
    balances[transactionType]?.[vehicleClass]?.[zevClass] || {};
  const total = Object.values(filteredBalance).reduce(
    (acc, value) => acc.plus(value),
    new Decimal(0),
  );
  return total;
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

export const flattenZevUnitRecords = (
  records: ZevUnitRecord[],
): ZevUnitRecord[] => {
  const result: ZevUnitRecord[] = [];
  const zevUnitsMap = getSummedZevUnitRecordsObj(records);
  Object.entries(zevUnitsMap).forEach(([type, vehicleClassMap]) => {
    if (isTransactionType(type)) {
      Object.entries(vehicleClassMap).forEach(([vehicleClass, zevClassMap]) => {
        if (isVehicleClass(vehicleClass)) {
          Object.entries(zevClassMap).forEach(([zevClass, modelYearsMap]) => {
            if (isZevClass(zevClass)) {
              Object.entries(modelYearsMap).forEach(
                ([modelYear, numberOfUnits]) => {
                  if (isModelYear(modelYear)) {
                    result.push({
                      type,
                      vehicleClass,
                      zevClass,
                      modelYear,
                      numberOfUnits,
                    });
                  }
                },
              );
            }
          });
        }
      });
    }
  });
  return result.filter((record) => !record.numberOfUnits.equals(0));
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

  for (const vehicleClass of Object.values(VehicleClass)) {
    for (const zevClass of Object.values(ZevClass)) {
      for (const modelYear of Object.values(ModelYear)) {
        const credits = creditsMap[vehicleClass]?.[zevClass]?.[modelYear] ?? [];
        const transfersAway =
          transfersAwayMap[vehicleClass]?.[zevClass]?.[modelYear] ?? [];
        const [offsettedRecords] = offset(credits, transfersAway);
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
  return offsetCertainDebitsBySameZevClass(
    zevUnitRecords,
    getSpecialZevClassPairs(),
  );
};

// section 12(2)(b)
export const offsetUnspecifiedDebits = (
  zevUnitRecords: ZevUnitRecord[],
  zevClassesOrdered: ZevClass[],
): [ZevUnitRecord[], ZevUnitRecord[]] => {
  const zevClassesSet = new Set(zevClassesOrdered);
  const isTotallyOrdered = Object.values(ZevClass).every((zevClass) =>
    zevClassesSet.has(zevClass),
  );
  if (!isTotallyOrdered) {
    throw new IncompleteOrdering();
  }
  const result = [];
  const offsettedCreditsResult = [];
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
  for (const vehicleClass of Object.values(VehicleClass)) {
    const creditsByVehicleClass = [];
    const debits = debitsMap[vehicleClass] ?? [];
    for (const zevClass of zevClassesOrdered) {
      const credits = creditsMap[vehicleClass]?.[zevClass] ?? [];
      creditsByVehicleClass.push(...credits);
    }
    const [resultOfOffset, offsettedCredits] = offset(
      creditsByVehicleClass,
      debits,
    );
    result.push(...resultOfOffset);
    offsettedCreditsResult.push(...offsettedCredits);
  }
  return [result, offsettedCreditsResult];
};

// section 12(2)(c)(i)
export const offsetOtherDebitsWithUnspecifiedCredits = (
  zevUnitRecords: ZevUnitRecord[],
): [ZevUnitRecord[], ZevUnitRecord[]] => {
  const result = [];
  const offsettedCreditsResult = [];
  type ZevUnitsMap = Partial<Record<VehicleClass, ZevUnitRecord[]>>;
  const creditsMap: ZevUnitsMap = {};
  const debitsMap: ZevUnitsMap = {};
  const otherZevClassPairs = getOtherZevClassPairs();

  for (const record of zevUnitRecords) {
    let map = null;
    const recordType = record.type;
    const vehicleClass = record.vehicleClass;
    const zevClass = record.zevClass;
    if (
      recordType === TransactionType.CREDIT &&
      zevClass === ZevClass.UNSPECIFIED &&
      otherZevClassPairs.some(
        ([otherVehicleClass]) => vehicleClass === otherVehicleClass,
      )
    ) {
      map = creditsMap;
    } else if (
      recordType === TransactionType.DEBIT &&
      otherZevClassPairs.some(
        ([otherVehicleClass, otherZevClass]) =>
          vehicleClass === otherVehicleClass && zevClass === otherZevClass,
      )
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
  for (const vehicleClass of Object.values(VehicleClass)) {
    const credits = creditsMap[vehicleClass] ?? [];
    const debits = debitsMap[vehicleClass] ?? [];
    const [resultOfOffset, offsettedCredits] = offset(credits, debits);
    result.push(...resultOfOffset);
    offsettedCreditsResult.push(...offsettedCredits);
  }
  return [result, offsettedCreditsResult];
};

// section 12(2)(c)(ii)
export const offsetOtherDebitsWithMatchingCredits = (
  zevUnitRecords: ZevUnitRecord[],
) => {
  return offsetCertainDebitsBySameZevClass(
    zevUnitRecords,
    getOtherZevClassPairs(),
  );
};

const offsetCertainDebitsBySameZevClass = (
  zevUnitRecords: ZevUnitRecord[],
  zevClassPairs: [VehicleClass, ZevClass][],
): [ZevUnitRecord[], ZevUnitRecord[]] => {
  const result = [];
  const offsettedCreditsResult = [];
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
    if (
      map &&
      zevClassPairs.some(
        ([pairVehicleClass, pairZevClass]) =>
          vehicleClass === pairVehicleClass && zevClass === pairZevClass,
      )
    ) {
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
  for (const vehicleClass of Object.values(VehicleClass)) {
    for (const zevClass of Object.values(ZevClass)) {
      const credits = creditsMap[vehicleClass]?.[zevClass] ?? [];
      const debits = debitsMap[vehicleClass]?.[zevClass] ?? [];
      const [resultOfOffset, offsettedCredits] = offset(credits, debits);
      result.push(...resultOfOffset);
      offsettedCreditsResult.push(...offsettedCredits);
    }
  }
  return [result, offsettedCreditsResult];
};

// returns [resultOfOffset, creditsThatWereOffset]
const offset = (
  credits: ZevUnitRecord[],
  debits: ZevUnitRecord[],
): [ZevUnitRecord[], ZevUnitRecord[]] => {
  const creditSeries = getSeries(credits);
  const debitSeries = getSeries(debits);
  const creditSeriesLength = creditSeries.length;
  const debitSeriesLength = debitSeries.length;
  if (creditSeriesLength === 0) {
    return [debits, []];
  }
  if (debitSeriesLength === 0) {
    return [credits, []];
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
        const remainder = term.minus(lesserElement);
        const recordInQuestion = sequence[index];
        const remainsOfRecord = {
          ...recordInQuestion,
          numberOfUnits: remainder,
        };
        const result = [remainsOfRecord].concat(sequence.slice(index + 1));
        if (recordInQuestion.type === TransactionType.CREDIT) {
          const offsettedCredits: ZevUnitRecord[] = [];
          const headOffsettedCredits = sequence.slice(0, index);
          const takenAway = recordInQuestion.numberOfUnits.minus(remainder);
          const takenAwayRecord = {
            ...recordInQuestion,
            numberOfUnits: takenAway,
          };
          const allOffsettedCredits = headOffsettedCredits.concat([
            takenAwayRecord,
          ]);
          offsettedCredits.push(...allOffsettedCredits);
          return [result, offsettedCredits];
        }
        // debits strictly dominated, credits all offset
        return [result, credits];
      }
    }
  }
  // credits = debits
  return [[], credits];
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

export const getSpecialZevClassPairs = (): [VehicleClass, ZevClass][] => {
  const result: [VehicleClass, ZevClass][] = [];
  Object.entries(specialComplianceRatios).forEach(([vehicleClass, subMap]) => {
    if (isVehicleClass(vehicleClass)) {
      Object.keys(subMap).forEach((zevClass) => {
        if (isZevClass(zevClass)) {
          result.push([vehicleClass, zevClass]);
        }
      });
    }
  });
  return result;
};

export const getOtherZevClassPairs = (): [VehicleClass, ZevClass][] => {
  const result: [VehicleClass, ZevClass][] = [];
  const specialZevClassPairs = getSpecialZevClassPairs();
  Object.values(VehicleClass).forEach((vehicleClass) => {
    Object.values(ZevClass).forEach((zevClass) => {
      if (
        !specialZevClassPairs.some(
          ([specialVehicleClass, specialZevClass]) =>
            specialVehicleClass === vehicleClass &&
            specialZevClass === zevClass,
        )
      ) {
        result.push([vehicleClass, zevClass]);
      }
    });
  });
  return result;
};
