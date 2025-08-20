import { Decimal } from "@/prisma/generated/client/runtime/index-browser";
import { CreditTransferPayload } from "./actions";
import {
  isModelYear,
  isVehicleClass,
  isZevClass,
} from "@/app/lib/utils/typeGuards";

export const getCreditTransferPayload = (
  transferTo: string,
  transferLines: Partial<Record<string, string>>[],
): CreditTransferPayload => {
  try {
    const transferToDec = new Decimal(transferTo);
    if (!transferToDec.isInteger()) {
      throw new Error();
    }
  } catch (e) {
    throw new Error("Invalid Transfer Partner!");
  }
  if (transferLines.length === 0) {
    throw new Error("No transfer content!");
  }
  const transferContent = transferLines.map((line) => {
    const vehicleClass = line.vehicleClass;
    const zevClass = line.zevClass;
    const modelYear = line.modelYear;
    const numberOfUnits = line.numberOfUnits;
    const dollarValuePerUnit = line.dollarValuePerUnit;
    if (
      !vehicleClass ||
      !zevClass ||
      !modelYear ||
      !numberOfUnits ||
      !dollarValuePerUnit ||
      !isVehicleClass(vehicleClass) ||
      !isZevClass(zevClass) ||
      !isModelYear(modelYear)
    ) {
      throw new Error("Invalid value detected!");
    }
    try {
      const unitsDec = new Decimal(numberOfUnits);
      const dollarValueDec = new Decimal(dollarValuePerUnit);
      if (unitsDec.decimalPlaces() > 2 || dollarValueDec.decimalPlaces() > 2) {
        throw new Error();
      }
    } catch (e) {
      throw new Error(
        "Number of Units and Dollar Value per Unit must be valid numbers rounded to 2 decimal places or less!",
      );
    }
    return {
      vehicleClass,
      zevClass,
      modelYear,
      numberOfUnits: new Decimal(numberOfUnits).toString(),
      dollarValuePerUnit: new Decimal(dollarValuePerUnit).toString(),
    };
  });
  return {
    transferToId: new Decimal(transferTo).toNumber(),
    transferContent,
  };
};
