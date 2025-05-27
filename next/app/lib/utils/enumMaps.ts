// currently, a prisma object {key -> value} generated from a schema enum is
// such that key = value, regardless of the usage of the @map attribute;
// please see: https://github.com/prisma/prisma/issues/8446.
// to overcome this issue, we can use the maps below; not great from a maintenance perspective,
// so hopefully prisma addresses this soon!

import { VehicleClass, ZevClass, ModelYear } from "@/prisma/generated/client";

const lowerCaseAndCapitalize = (s: string) => {
  const firstLetter = s.charAt(0);
  const lowerCasedTail = s.toLowerCase().slice(1);
  return firstLetter + lowerCasedTail;
};

export const getModelYearEnumsToStringsMap = () => {
  const result: Partial<Record<ModelYear, string>> = {};
  for (const key of Object.keys(ModelYear)) {
    result[key as ModelYear] = key.split("_")[1];
  }
  return result;
};

export const getStringsToModelYearsEnumsMap = () => {
  const result: Partial<Record<string, ModelYear>> = {};
  for (const key of Object.keys(ModelYear)) {
    result[key.split("_")[1]] = key as ModelYear;
  }
  return result;
};

export const getZevClassEnumsToStringsMap = () => {
  const result: Partial<Record<ZevClass, string>> = {};
  for (const key of Object.keys(ZevClass)) {
    if (key.length > 1) {
      result[key as ZevClass] = lowerCaseAndCapitalize(key);
    } else {
      result[key as ZevClass] = key;
    }
  }
  return result;
};

export const getStringsToZevClassEnumsMap = () => {
  const result: Partial<Record<string, ZevClass>> = {};
  for (const key of Object.keys(ZevClass)) {
    if (key.length > 1) {
      result[lowerCaseAndCapitalize(key)] = key as ZevClass;
    } else {
      result[key] = key as ZevClass;
    }
  }
  return result;
};

export const getVehicleClassEnumsToStringsMap = () => {
  const result: Partial<Record<VehicleClass, string>> = {};
  for (const key of Object.keys(VehicleClass)) {
    result[key as VehicleClass] = lowerCaseAndCapitalize(key);
  }
  return result;
};

export const getStringsToVehiclClassEnumsMap = () => {
  const result: Partial<Record<string, VehicleClass>> = {};
  for (const key of Object.keys(VehicleClass)) {
    result[lowerCaseAndCapitalize(key)] = key as VehicleClass;
  }
  return result;
};
