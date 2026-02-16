import {
  ModelYear,
  VehicleClass,
  ZevType,
  ZevClass,
} from "@/prisma/generated/enums";
import {
  VehicleWhereInput,
  VehicleOrderByWithRelationInput,
} from "@/prisma/generated/models";
import { Decimal } from "decimal.js";
import {
  getMatchingTerms,
  getStringsToModelYearsEnumsMap,
  getStringsToVehicleStatusEnumsMap,
  getStringsToZevClassEnumsMap,
} from "@/app/lib/utils/enumMaps";
import { VehicleActiveFilter } from "@/app/lib/constants/filter";

export const getWhereClause = (filters: {
  [key: string]: string;
}): VehicleWhereInput => {
  const result: VehicleWhereInput = {};
  const statusMap = getStringsToVehicleStatusEnumsMap();
  const zevClassMap = getStringsToZevClassEnumsMap();
  const modelYearsMap = getStringsToModelYearsEnumsMap();
  for (const [key, rawValue] of Object.entries(filters)) {
    const value = rawValue.trim();
    if (key === "id" || key === "legacyId") {
      result[key] = Number.parseInt(value, 10);
    } else if (key === "organization") {
      result[key] = {
        is: { name: { contains: value, mode: "insensitive" } },
      };
    } else if (key === "status") {
      result[key] = {
        in: getMatchingTerms(statusMap, value),
      };
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
      result[key] = {
        in: getMatchingTerms(zevClassMap, value),
      };
    } else if (key === "modelYear") {
      result[key] = {
        in: getMatchingTerms(modelYearsMap, value),
      };
    } else if (key === "zevType") {
      result[key] = {
        in: getMatchingTerms(ZevType, value),
      };
    } else if (key === VehicleActiveFilter.key) {
      const newValue = value.toLowerCase().trim();
      if (newValue === VehicleActiveFilter.activeValue) {
        result[key] = true;
      } else if (newValue === VehicleActiveFilter.inactiveValue) {
        result[key] = false;
      } else {
        result.id = -1;
      }
    } else if (key === "submittedCount" || key === "issuedCount") {
      result[key] = Number.parseInt(value, 10);
    }
  }
  return result;
};

export const getOrderByClause = (
  sorts: { [key: string]: string },
  defaultSortById: boolean,
): VehicleOrderByWithRelationInput[] => {
  const result: VehicleOrderByWithRelationInput[] = [];
  for (const [key, value] of Object.entries(sorts)) {
    const orderBy: VehicleOrderByWithRelationInput = {};
    if (value === "asc" || value === "desc") {
      if (
        key === "id" ||
        key === "legacyId" ||
        key === "status" ||
        key === "modelName" ||
        key === "make" ||
        key === "status" ||
        key === "numberOfUnits" ||
        key === "range" ||
        key === "zevClass" ||
        key === "modelYear" ||
        key === "zevType" ||
        key === "isActive" ||
        key === "submittedCount" ||
        key === "issuedCount"
      ) {
        orderBy[key] = value;
      } else if (key === "organization") {
        orderBy[key] = {
          name: value,
        };
      }
    }
    if (Object.keys(orderBy).length > 0) {
      result.push(orderBy);
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

export const getVehicleClass = (
  modelYear: ModelYear,
  weight: number,
): VehicleClass => {
  const weightDec = new Decimal(weight);
  if (
    (modelYear <= ModelYear.MY_2023 && weightDec.lte(3856)) ||
    (modelYear >= ModelYear.MY_2024 && weightDec.lte(4536))
  ) {
    return VehicleClass.REPORTABLE;
  }
  throw new Error("Cannot associate a vehicle class with this vehicle!");
};

export const getZevClass = (
  modelYear: ModelYear,
  zevType: ZevType,
  range: number,
): ZevClass => {
  const rangeDec = new Decimal(range);
  if (
    modelYear <= ModelYear.MY_2025 &&
    ((zevType === ZevType.BEV && rangeDec.gte("80.47")) ||
      (zevType === ZevType.EREV && rangeDec.gte(121)) ||
      (zevType === ZevType.FCEV && rangeDec.gte("80.47")))
  ) {
    return ZevClass.A;
  }
  if (
    modelYear >= ModelYear.MY_2026 &&
    ((zevType === ZevType.BEV && rangeDec.gte(241)) ||
      (zevType === ZevType.FCEV && rangeDec.gte(241)))
  ) {
    return ZevClass.A;
  }
  if (
    modelYear <= ModelYear.MY_2025 &&
    ((zevType === ZevType.EREV && rangeDec.gte(16) && rangeDec.lt(121)) ||
      (zevType === ZevType.PHEV && rangeDec.gte(16)))
  ) {
    return ZevClass.B;
  }
  if (
    modelYear >= ModelYear.MY_2026 &&
    ((zevType === ZevType.EREV && rangeDec.gte(80)) ||
      (zevType === ZevType.PHEV &&
        modelYear === ModelYear.MY_2026 &&
        rangeDec.gte(55)) ||
      (zevType === ZevType.PHEV &&
        modelYear === ModelYear.MY_2027 &&
        rangeDec.gte(65)) ||
      (zevType === ZevType.PHEV &&
        modelYear >= ModelYear.MY_2028 &&
        rangeDec.gte(80)))
  ) {
    return ZevClass.B;
  }
  throw new Error("Cannot associate a zev class with this vehicle!");
};
