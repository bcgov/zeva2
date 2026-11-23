import Decimal from "decimal.js";
import { caRecordKeyDelimiter } from "./constants";

export const checkCaRecordKey = (key: string, delimiterCount: number) => {
  let count = 0;
  for (const char of key) {
    if (char === caRecordKeyDelimiter) {
      count = count + 1;
    }
  }
  if (count !== delimiterCount) {
    throw new Error("Invalid Key!");
  }
};

// this function affects getSupplierVinStatRecords and getGovStatRecords!
export const getStatsKey = (
  vehicleClass: string,
  zevClass: string,
  modelYear: string,
  make: string,
  modelName: string,
  zevType: string,
  range: string,
  legacyNumberOfUnits: string,
  numberOfUnits: string,
) => {
  const key = [
    vehicleClass,
    zevClass,
    modelYear,
    make,
    modelName,
    zevType,
    range,
    legacyNumberOfUnits,
    numberOfUnits,
  ].join(caRecordKeyDelimiter);
  checkCaRecordKey(key, 8);
  return key;
};

// this function is affected by getStatsKey!
export const getSupplierVinStatRecords = (stats: Record<string, number>) => {
  const result = [];
  for (const [key, count] of Object.entries(stats)) {
    const fields = key.split(caRecordKeyDelimiter);
    const vehicleClass = fields[0];
    const zevClass = fields[1];
    const modelYear = fields[2];
    const make = fields[3];
    const modelName = fields[4];
    const zevType = fields[5];
    const range = fields[6];
    const legacyNumberOfUnits = fields[7];
    const numberOfUnits = fields[8];
    result.push({
      vehicleClass,
      make,
      modelName,
      modelYear,
      zevClass,
      zevType,
      range,
      legacyNumberOfUnits,
      numberOfUnits,
      count,
    });
  }
  return result;
};

// this function affects getSupplierCreditStatRecords!
export const getSupplierCreditStatsKey = (
  vehicleClass: string,
  zevClass: string,
  modelYear: string,
) => {
  const key = [vehicleClass, zevClass, modelYear].join(caRecordKeyDelimiter);
  checkCaRecordKey(key, 2);
  return key;
};

// this function is affected by getSupplierCreditStatsKey!
export const getSupplierCreditStatRecords = (
  stats: Record<string, Decimal>,
) => {
  const result = [];
  for (const [key, credits] of Object.entries(stats)) {
    const fields = key.split(caRecordKeyDelimiter);
    const zevClass = fields[1];
    const modelYear = fields[2];
    result.push({
      zevClass,
      modelYear,
      credits: credits.toString(),
    });
  }
  return result;
};

// this function is affected by getStatsKey!
export const getGovStatRecords = (
  stats: Record<
    string,
    {
      vinsCount: number;
      validVinsCount: number;
      creditsSum: Decimal;
      validCreditsSum: Decimal;
    }
  >,
) => {
  const result = [];
  for (const [
    key,
    { vinsCount, validVinsCount, creditsSum, validCreditsSum },
  ] of Object.entries(stats)) {
    const fields = key.split(caRecordKeyDelimiter);
    const vehicleClass = fields[0];
    const zevClass = fields[1];
    const modelYear = fields[2];
    const make = fields[3];
    const modelName = fields[4];
    const zevType = fields[5];
    const range = fields[6];
    const legacyNumberOfUnits = fields[7];
    const numberOfUnits = fields[8];
    result.push({
      vehicleClass,
      make,
      modelName,
      modelYear,
      zevClass,
      zevType,
      range,
      legacyNumberOfUnits,
      numberOfUnits,
      vinsCount,
      validVinsCount,
      creditsSum,
      validCreditsSum,
    });
  }
  return result;
};
