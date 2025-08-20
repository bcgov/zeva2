import { VehiclePayload } from "./actions";
import { Decimal } from "@prisma/client/runtime/index-browser.js";
import {
  isModelYear,
  isVehicleClassCode,
  isVehicleZevType,
} from "@/app/lib/utils/typeGuards";
import { FileWithPath } from "react-dropzone";
import {
  ModelYear,
  VehicleClass,
  VehicleZevType,
  ZevClass,
} from "@/prisma/generated/client";

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
  if (!isModelYear(data.modelYear)) {
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
    const gvwrDec = new Decimal(data.gvwr);
    if (!gvwrDec.isInteger()) {
      throw new Error();
    }
  } catch (e) {
    throw new Error("GVWR must be an integer!");
  }
  const weight = new Decimal(data.gvwr).toNumber();
  getVehicleClass(data.modelYear, weight);
  const zevClass = getZevClass(data.modelYear, data.zevType, range);
  if (data.us06 === "true" && zevClass !== ZevClass.B) {
    throw new Error(
      "Additional 0.2 US06 credit applies only to ZEV Class B vehicles!",
    );
  }
  if (data.us06 === "true" && files.length === 0) {
    throw new Error("At least one file is required!");
  }
  return {
    modelYear: data.modelYear,
    make: data.make,
    modelName: data.modelName,
    us06RangeGte16: data.us06 === "true",
    range,
    vehicleClassCode: data.bodyType,
    vehicleZevType: data.zevType,
    weight,
  };
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
  throw new Error("Cannot associate a zev class with this vehicle!");
};
