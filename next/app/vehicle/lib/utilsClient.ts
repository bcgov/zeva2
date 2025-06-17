import { VehicleStatus } from "@/prisma/generated/client";
import { VehicleFormData } from "./components/VehicleForm";
import { VehiclePayload } from "./actions";
import { Decimal } from "@prisma/client/runtime/index-browser.js";

export const getVehiclePayload = (
  data: VehicleFormData,
  status: VehicleStatus,
): VehiclePayload => {
  if (
    !data.modelYear ||
    !data.make ||
    !data.modelName ||
    !data.zevType ||
    !data.bodyType
  ) {
    throw new Error("All fields are required!");
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
  return {
    modelYear: data.modelYear,
    make: data.make,
    modelName: data.modelName,
    hasPassedUs06Test: data.us06,
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
