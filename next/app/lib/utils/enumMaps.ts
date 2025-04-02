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

export const getVehicleClassEnumMap = () => {
  const result: { [key: string]: string } = {};
  for (const key of Object.keys(VehicleClass)) {
    result[key] = lowerCaseAndCapitalize(key);
  }
  return result;
};

export const getZevClassEnumMap = () => {
  const result: { [key: string]: string } = {};
  for (const key of Object.keys(ZevClass)) {
    if (key.length > 1) {
      result[key] = lowerCaseAndCapitalize(key);
    } else {
      result[key] = key;
    }
  }
  return result;
};

export const getModelYearEnumMap = () => {
  const result: { [key: string]: string } = {};
  for (const key of Object.keys(ModelYear)) {
    result[key] = key.split("_")[1];
  }
  return result;
};

// expects map to be 1-1
export const getInverseMap = (map: { [key: string]: string }) => {
  const result: { [key: string]: string } = {};
  for (const [key, value] of Object.entries(map)) {
    if (result[value]) {
      throw new Error();
    }
    result[value] = key;
  }
  return result;
};
