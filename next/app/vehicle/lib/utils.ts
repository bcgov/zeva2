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
  VehicleStatus,
  VehicleZevType,
  ZevClass,
} from "@/prisma/generated/client";
import { Decimal } from "@prisma/client/runtime/library";

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
    } else if (key === "creditValue" || key === "range") {
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
        key === "creditValue" ||
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
