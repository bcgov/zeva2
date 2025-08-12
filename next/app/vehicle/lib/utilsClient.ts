import { VehicleStatus } from "@/prisma/generated/client";
import { VehiclePayload } from "./actions";
import { Decimal } from "@prisma/client/runtime/index-browser.js";
import { getStringsToModelYearsEnumsMap } from "@/app/lib/utils/enumMaps";
import {
  isVehicleClassCode,
  isVehicleZevType,
} from "@/app/lib/utils/typeGuards";
import { FileWithPath } from "react-dropzone";

export const getVehiclePayload = (
  data: Partial<Record<string, string>>,
  files: FileWithPath[],
  status: VehicleStatus,
): VehiclePayload => {
  if (
    !data.modelYear ||
    !data.make ||
    !data.modelName ||
    !data.zevType ||
    !data.bodyType ||
    !data.range ||
    !data.gvwr
  ) {
    throw new Error("All fields are required!");
  }
  const modelYearsMap = getStringsToModelYearsEnumsMap();
  const modelYearEnum = modelYearsMap[data.modelYear];
  if (!modelYearEnum) {
    throw new Error("Invalid Model Year!");
  }
  if (!isVehicleZevType(data.zevType)) {
    throw new Error("Invalid ZEV Type!");
  }
  if (!isVehicleClassCode(data.bodyType)) {
    throw new Error("Invalid Body type!");
  }
  const range = parseInt(data.range, 10);
  if (Number.isNaN(range)) {
    throw new Error("Invalid range!");
  }
  try {
    new Decimal(data.gvwr);
  } catch (e) {
    throw new Error("Invalid GVWR!");
  }
  if (data.us06 === "true" && files.length === 0) {
    throw new Error("At least one file is required!");
  }
  return {
    modelYear: modelYearEnum,
    make: data.make,
    modelName: data.modelName,
    hasPassedUs06Test: data.us06 === "true",
    range,
    vehicleClassCode: data.bodyType,
    vehicleZevType: data.zevType,
    weightKg: data.gvwr,
    status,
    creditValue: null,
    zevClass: null,
    vehicleClass: null,
  };
};
