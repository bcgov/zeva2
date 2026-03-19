import { Decimal } from "decimal.js";
import { AgreementContentPayload, AgreementContentRecord } from "./constants";

export const contentIsValid = (
  content: AgreementContentRecord[],
): content is AgreementContentPayload[] => {
  for (const record of content) {
    if (!record.vehicleClass || !record.zevClass || !record.modelYear) {
      return false;
    }
    try {
      const numberOfUnitsDec = new Decimal(record.numberOfUnits);
      if (numberOfUnitsDec.lte(0) || numberOfUnitsDec.decimalPlaces() > 2) {
        throw new Error();
      }
    } catch {
      return false;
    }
  }
  return true;
};
