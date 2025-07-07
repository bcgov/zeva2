// currently, a prisma object {key -> value} generated from a schema enum is
// such that key = value, regardless of the usage of the @map attribute;
// please see: https://github.com/prisma/prisma/issues/8446.
// to overcome this issue, we can use the maps below; not great from a maintenance perspective,
// so hopefully prisma addresses this soon!

import {
  VehicleClass,
  ZevClass,
  ModelYear,
  PenaltyCreditStatus,
  Idp,
  Role,
  ReferenceType,
} from "@/prisma/generated/client";

const lowerCaseAndCapitalize = (s: string) => {
  const firstLetter = s.charAt(0);
  const lowerCasedTail = s.toLowerCase().slice(1);
  return firstLetter + lowerCasedTail;
};

const getTransformed = (s: string) => {
  const splitString = s.split("_");
  const transformed = splitString.map((t) => {
    return lowerCaseAndCapitalize(t);
  });
  return transformed.join(" ");
};

export const getModelYearEnumsToStringsMap = () => {
  const result: Partial<Record<ModelYear, string>> = {};
  for (const value of Object.values(ModelYear)) {
    result[value] = value.split("_")[1];
  }
  return result;
};

export const getStringsToModelYearsEnumsMap = () => {
  const result: Partial<Record<string, ModelYear>> = {};
  for (const value of Object.values(ModelYear)) {
    result[value.split("_")[1]] = value;
  }
  return result;
};

export const getZevClassEnumsToStringsMap = () => {
  const result: Partial<Record<ZevClass, string>> = {};
  for (const value of Object.values(ZevClass)) {
    if (value.length > 1) {
      result[value] = lowerCaseAndCapitalize(value);
    } else {
      result[value] = value;
    }
  }
  return result;
};

export const getStringsToZevClassEnumsMap = () => {
  const result: Partial<Record<string, ZevClass>> = {};
  for (const value of Object.values(ZevClass)) {
    if (value.length > 1) {
      result[lowerCaseAndCapitalize(value)] = value;
    } else {
      result[value] = value;
    }
  }
  return result;
};

export const getVehicleClassEnumsToStringsMap = () => {
  const result: Partial<Record<VehicleClass, string>> = {};
  for (const value of Object.values(VehicleClass)) {
    result[value] = lowerCaseAndCapitalize(value);
  }
  return result;
};

export const getStringsToVehicleClassEnumsMap = () => {
  const result: Partial<Record<string, VehicleClass>> = {};
  for (const value of Object.values(VehicleClass)) {
    result[lowerCaseAndCapitalize(value)] = value;
  }
  return result;
};

export const getPenaltyCreditStatusEnumsToStringsMap = () => {
  const result: Partial<Record<PenaltyCreditStatus, string>> = {};
  for (const value of Object.values(PenaltyCreditStatus)) {
    result[value] = getTransformed(value);
  }
  return result;
};

export const getStringsToPenaltyCreditStatusEnumsMap = () => {
  const result: Partial<Record<string, PenaltyCreditStatus>> = {};
  for (const value of Object.values(PenaltyCreditStatus)) {
    result[getTransformed(value)] = value;
  }
  return result;
};

export const getStringsToIdpEnumsMap = () => {
  const result: Partial<Record<string, Idp>> = {};
  for (const value of Object.values(Idp)) {
    result[value.toLowerCase().replaceAll("_", "")] = value;
  }
  return result;
};

export const getIdpEnumsToStringsMap = () => {
  const result: Partial<Record<Idp, string>> = {};
  for (const value of Object.values(Idp)) {
    result[value] = value.toLowerCase().replaceAll("_", "");
  }
  return result;
};

export const getStringsToRoleEnumsMap = () => {
  const result: Partial<Record<string, Role>> = {};
  for (const value of Object.values(Role)) {
    result[getTransformed(value)] = value;
  }
  return result;
};

export const getRoleEnumsToStringsMap = () => {
  const result: Partial<Record<Role, string>> = {};
  for (const value of Object.values(Role)) {
    result[value] = getTransformed(value);
  }
  return result;
};

export const getStringsToReferenceTypeEnumsMap = () => {
  const result: Partial<Record<string, ReferenceType>> = {};
  for (const value of Object.values(ReferenceType)) {
    result[getTransformed(value)] = value;
  }
  return result;
};

export const getReferenceTypeEnumsToStringsMap = () => {
  const result: Partial<Record<ReferenceType, string>> = {};
  for (const value of Object.values(ReferenceType)) {
    result[value] = getTransformed(value);
  }
  return result;
};
