import { VehiclePayload } from "./actions";
import { Decimal } from "@prisma/client/runtime/index-browser.js";
import {
  isModelYear,
  isVehicleClassCode,
  isZevType,
} from "@/app/lib/utils/typeGuards";
import { ModelYear } from "@/prisma/generated/client";

export const getVehiclePayload = (
  data: Partial<Record<string, string>>,
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
  if (!isModelYear(data.modelYear) || data.modelYear < ModelYear.MY_2019) {
    throw new Error("Invalid Model Year!");
  }
  if (!isZevType(data.zevType)) {
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
    const gvwrDec = new Decimal(data.gvwr);
    if (!gvwrDec.isInteger()) {
      throw new Error();
    }
  } catch (e) {
    throw new Error("GVWR must be an integer!");
  }
  const weight = new Decimal(data.gvwr).toNumber();
  return {
    modelYear: data.modelYear,
    make: data.make,
    modelName: data.modelName,
    us06RangeGte16: data.us06 === "true",
    range,
    vehicleClassCode: data.bodyType,
    zevType: data.zevType,
    weight,
  };
};
