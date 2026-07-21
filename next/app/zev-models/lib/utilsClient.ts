import { VehiclePayload } from "./actions";
import { Decimal } from "decimal.js";
import { isModelYear, isZevType } from "@/app/lib/utils/typeGuards";
import { ModelYear } from "@/prisma/generated/enums";
import { VehicleFormData } from "./components/VehicleForm";
import { getStringsToVehicleClassCodeEnumsMap } from "@/app/lib/utils/enumMaps";

export const getVehiclePayload = (data: VehicleFormData): VehiclePayload => {
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
  const classCodesMap = getStringsToVehicleClassCodeEnumsMap();
  const classCode = classCodesMap[data.bodyType];
  if (!classCode) {
    throw new Error("Invalid Body type!");
  }
  gvwrCheck(data.gvwr);
  const weight = new Decimal(data.gvwr).toNumber();
  rangeCheck(data.range);
  const range = new Decimal(data.range).toNumber();
  return {
    modelYear: data.modelYear,
    make: data.make,
    modelName: data.modelName,
    us06RangeGte16: data.us06 === "true",
    range,
    vehicleClassCode: classCode,
    zevType: data.zevType,
    weight,
  };
};

export const gvwrCheck = (gvwr: string) => {
  try {
    const gvwrDec = new Decimal(gvwr);
    if (!gvwrDec.isInteger() || gvwrDec.lte(0) || gvwrDec.gt(4536)) {
      throw new Error();
    }
  } catch (e) {
    throw new Error("Invalid GVWR!");
  }
};

export const rangeCheck = (range: string) => {
  try {
    const rangeDec = new Decimal(range);
    if (!rangeDec.isInteger() || rangeDec.lte(0)) {
      throw new Error();
    }
  } catch (e) {
    throw new Error("Invalid Electric EPA Range!");
  }
};
