import { PenaltyCreditPayload } from "./actions";
import { Decimal } from "decimal.js";
import {
  isModelYear,
  isVehicleClass,
  isZevClass,
} from "@/app/lib/utils/typeGuards";

const MissingInputError = new Error("All fields are required!");
const InvalidInputError = new Error("Invalid Input Detected!");

export const getPenaltyCreditPayload = (
  data: Partial<Record<string, string>>,
): PenaltyCreditPayload => {
  const organizationId = data.organizationId;
  const complianceYear = data.complianceYear;
  const vehicleClass = data.vehicleClass;
  const zevClass = data.zevClass;
  const modelYear = data.modelYear;
  const numberOfUnits = data.numberOfUnits;

  if (
    !organizationId ||
    !complianceYear ||
    !vehicleClass ||
    !zevClass ||
    !modelYear ||
    !numberOfUnits
  ) {
    throw MissingInputError;
  }

  const orgIdInt = Number.parseInt(organizationId, 10);
  if (Number.isNaN(orgIdInt)) {
    throw InvalidInputError;
  }

  if (
    !isModelYear(complianceYear) ||
    !isVehicleClass(vehicleClass) ||
    !isZevClass(zevClass) ||
    !isModelYear(modelYear)
  ) {
    throw InvalidInputError;
  }

  try {
    const units = new Decimal(numberOfUnits);
    if (!new Decimal(units.toFixed(2)).equals(units)) {
      throw new Error();
    }
  } catch (e) {
    throw new Error(
      "Invalid Number of Units; Number of Units must be no more than 2 decimal places!",
    );
  }

  return {
    organizationId: orgIdInt,
    complianceYear: complianceYear,
    vehicleClass: vehicleClass,
    zevClass: zevClass,
    modelYear: modelYear,
    numberOfUnits,
  };
};
