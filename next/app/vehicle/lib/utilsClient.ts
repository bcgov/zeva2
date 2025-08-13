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
  try {
    const rangeDec = new Decimal(data.range);
    if (!rangeDec.isInteger()) {
      throw new Error();
    }
  } catch (e) {
    throw new Error("Range must be an integer!");
  }
  const range = new Decimal(data.range).toNumber();
  try {
    const gvwr = new Decimal(data.gvwr);
    if (gvwr.decimalPlaces() > 2) {
      throw new Error();
    }
  } catch (e) {
    throw new Error(
      "GVWR must be a number rounded to no more than 2 decimal places!",
    );
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
  };
};
