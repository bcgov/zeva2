import {
  isModelYear,
  isVehicleStatus,
  isVehicleZevType,
  isZevClass,
} from "@/app/lib/utils/typeGuards";
import { getEnumOr } from "@/lib/utils/getEnums";
import {
  ModelYear,
  Prisma,
  VehicleClass,
  VehicleStatus,
  VehicleZevType,
  ZevClass,
} from "@/prisma/generated/client";
import { Decimal } from "@/prisma/generated/client/runtime/library";

export const getWhereClause = (filters: {
  [key: string]: string;
}): Prisma.VehicleWhereInput => {
  const result: Prisma.VehicleWhereInput = {};
  result.AND = [];
  for (const [key, rawValue] of Object.entries(filters)) {
    const value = rawValue.trim();
    if (key === "organization") {
      result[key] = {
        is: { name: { contains: value, mode: "insensitive" } },
      };
    } else if (key === "status") {
      const upperCaseValue = value.toUpperCase();
      const statuses = Object.keys(VehicleStatus);
      const matches = statuses.filter((s) => {
        return s.replaceAll("_", "").includes(upperCaseValue);
      });
      result.AND.push({ OR: getEnumOr("status", matches, isVehicleStatus) });
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
      const upperCaseValue = value.toUpperCase();
      const zevClasses = Object.keys(ZevClass);
      const matches = zevClasses.filter((zc) => {
        return zc.includes(upperCaseValue);
      });
      result.AND.push({ OR: getEnumOr("zevClass", matches, isZevClass) });
    } else if (key === "modelYear") {
      const modelYears = Object.keys(ModelYear);
      const matches = modelYears.filter((my) => {
        const year = my.split("_")[1];
        if (year) {
          return year.includes(value);
        }
        return false;
      });
      result.AND.push({ OR: getEnumOr("modelYear", matches, isModelYear) });
    } else if (key === "vehicleZevType") {
      const lowerCaseValue = value.toLowerCase();
      const zevTypes = Object.keys(VehicleZevType);
      const matches = zevTypes.filter((zt) => {
        return zt.toLowerCase().includes(lowerCaseValue);
      });
      result.AND.push({
        OR: getEnumOr("vehicleZevType", matches, isVehicleZevType),
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

export const getVehicleClass = (
  modelYear: ModelYear,
  weight: string,
): VehicleClass => {
  const weightDec = new Decimal(weight);
  if (
    (modelYear <= ModelYear.MY_2023 && weightDec.lte(3856)) ||
    (modelYear >= ModelYear.MY_2024 && weightDec.lte(4536))
  ) {
    return VehicleClass.REPORTABLE;
  }
  throw new Error("Cannot associate a vehicle class to this vehicle!");
};

export const getZevClass = (
  modelYear: ModelYear,
  zevType: VehicleZevType,
  range: number,
): ZevClass => {
  const rangeDec = new Decimal(range);
  if (
    modelYear <= ModelYear.MY_2025 &&
    ((zevType === VehicleZevType.BEV && rangeDec.gte("80.47")) ||
      (zevType === VehicleZevType.EREV && rangeDec.gte(121)) ||
      (zevType === VehicleZevType.FCEV && rangeDec.gte("80.47")))
  ) {
    return ZevClass.A;
  }
  if (
    modelYear >= ModelYear.MY_2026 &&
    ((zevType === VehicleZevType.BEV && rangeDec.gte(241)) ||
      (zevType === VehicleZevType.FCEV && rangeDec.gte(241)))
  ) {
    return ZevClass.A;
  }
  if (
    modelYear <= ModelYear.MY_2025 &&
    ((zevType === VehicleZevType.EREV &&
      rangeDec.gte(16) &&
      rangeDec.lt(121)) ||
      (zevType === VehicleZevType.PHEV && rangeDec.gte(16)))
  ) {
    return ZevClass.B;
  }
  if (
    modelYear >= ModelYear.MY_2026 &&
    ((zevType === VehicleZevType.EREV && rangeDec.gte(80)) ||
      (zevType === VehicleZevType.PHEV &&
        modelYear === ModelYear.MY_2026 &&
        rangeDec.gte(55)) ||
      (zevType === VehicleZevType.PHEV &&
        modelYear === ModelYear.MY_2027 &&
        rangeDec.gte(65)) ||
      (zevType === VehicleZevType.PHEV &&
        modelYear >= ModelYear.MY_2028 &&
        rangeDec.gte(80)))
  ) {
    return ZevClass.B;
  }
  throw new Error("Cannot associate a zev class to this vehicle!");
};

export const getNumberOfUnits = (
  zevClass: ZevClass,
  range: number,
  hasPassedUs06Test: boolean,
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
      if (hasPassedUs06Test && rangeDec.gte(16)) {
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
