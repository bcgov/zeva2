import { Prisma, VehicleZevType, ZevClass } from "@/prisma/generated/client";
import { Decimal } from "@/prisma/generated/client/runtime/library";
import { AttachmentsSubDirectory } from "./constants";
import {
  getMatchingTerms,
  getStringsToModelYearsEnumsMap,
  getStringsToVehicleStatusEnumsMap,
  getStringsToZevClassEnumsMap,
} from "@/app/lib/utils/enumMaps";

export const getOrConditions = <T>(
  terms: T[],
  key: keyof Prisma.VehicleWhereInput,
) => {
  if (terms.length === 0) {
    return [{ id: -1 }];
  }
  return terms.map((t) => {
    return { [key]: t };
  });
};

export const getWhereClause = (filters: {
  [key: string]: string;
}): Prisma.VehicleWhereInput => {
  const result: Prisma.VehicleWhereInput = {};
  result.AND = [];
  const statusMap = getStringsToVehicleStatusEnumsMap();
  const zevClassMap = getStringsToZevClassEnumsMap();
  const modelYearsMap = getStringsToModelYearsEnumsMap();
  for (const [key, rawValue] of Object.entries(filters)) {
    const value = rawValue.trim();
    if (key === "id" || key === "legacyId") {
      result[key] = parseInt(value, 10);
    } else if (key === "organization") {
      result[key] = {
        is: { name: { contains: value, mode: "insensitive" } },
      };
    } else if (key === "status") {
      result.AND.push({
        OR: getOrConditions(getMatchingTerms(statusMap, value), key),
      });
    } else if (key === "modelName" || key === "make") {
      result[key] = {
        contains: value,
        mode: "insensitive",
      };
    } else if (key === "numberOfUnits" || key === "range") {
      const decValue = new Decimal(value);
      result[key] = {
        equals: decValue.toNumber(),
      };
    } else if (key === "zevClass") {
      result.AND.push({
        OR: getOrConditions(getMatchingTerms(zevClassMap, value), key),
      });
    } else if (key === "modelYear") {
      result.AND.push({
        OR: getOrConditions(getMatchingTerms(modelYearsMap, value), key),
      });
    } else if (key === "vehicleZevType") {
      result.AND.push({
        OR: getOrConditions(getMatchingTerms(VehicleZevType, value), key),
      });
    } else if (key === "isActive") {
      const lowerCaseValue = value.toLowerCase();
      if ("yes".includes(lowerCaseValue)) {
        result[key] = true;
      } else if ("no".includes(lowerCaseValue)) {
        result[key] = false;
      } else {
        result.id = -1;
      }
    }
  }
  if (result.AND.length === 0) {
    delete result.AND;
  }
  return result;
};

export const getOrderByClause = (
  sorts: { [key: string]: string },
  defaultSortById: boolean,
): Prisma.VehicleOrderByWithRelationInput[] => {
  const result: Prisma.VehicleOrderByWithRelationInput[] = [];
  for (const [key, value] of Object.entries(sorts)) {
    if (value === "asc" || value === "desc") {
      if (
        key === "id" ||
        key === "legacyId" ||
        key === "status" ||
        key === "modelName" ||
        key === "make" ||
        key === "validationStatus" ||
        key === "numberOfUnits" ||
        key === "range" ||
        key === "zevClass" ||
        key === "modelYear" ||
        key === "vehicleZevType" ||
        key === "isActive"
      ) {
        result.push({ [key]: value });
      } else if (key === "organization") {
        result.push({ [key]: { name: value } });
      }
    }
  }
  if (defaultSortById && result.length === 0) {
    result.push({ id: "desc" });
  }
  return result;
};

export const getNumberOfUnits = (
  zevClass: ZevClass,
  range: number,
  us06RangeGte16: boolean,
): Decimal => {
  const currentTs = new Date();
  const threshold = new Date("2026-10-01T00:00:00");
  const rangeDec = new Decimal(range);
  if (currentTs < threshold) {
    if (zevClass === ZevClass.A) {
      const numberOfUnits = Decimal.min(
        4,
        rangeDec.times("0.006214").plus("0.5"),
      );
      return numberOfUnits.toDecimalPlaces(2);
    }
    if (zevClass === ZevClass.B) {
      let numberOfUnits = rangeDec.times("0.006214").plus("0.3");
      if (us06RangeGte16) {
        return Decimal.min(numberOfUnits.plus("0.2"), "1.30");
      }
      return Decimal.min(numberOfUnits, "1.10");
    }
  }
  if (zevClass === ZevClass.A || zevClass === ZevClass.B) {
    return new Decimal(1);
  }
  throw new Error("Cannot calculate the credit value for this vehicle!");
};

export const getAttachmentFullObjectName = (
  orgId: number,
  objectName: string,
) => {
  return `${orgId}/${AttachmentsSubDirectory.VehicleAttachments}/${objectName}`;
};
