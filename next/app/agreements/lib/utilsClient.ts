import { Decimal } from "@/prisma/generated/client/runtime/index-browser";

export const validateNumberOfUnits = (numberOfUnits: string) => {
  try {
    const numberOfUnitsDec = new Decimal(numberOfUnits);
    if (numberOfUnitsDec.lte(0) || numberOfUnitsDec.decimalPlaces() > 2) {
      throw new Error();
    }
  } catch (e) {
    throw new Error(
      "Number of Units and must be strictly positive numbers rounded to 2 decimal places or less!",
    );
  }
};
