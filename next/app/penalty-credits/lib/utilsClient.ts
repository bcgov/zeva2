import {
  getStringsToModelYearsEnumsMap,
  getStringsToVehicleClassEnumsMap,
  getStringsToZevClassEnumsMap,
} from "@/app/lib/utils/enumMaps";
import { PenaltyCreditPayload } from "./actions";
import { Decimal } from "@/prisma/generated/client/runtime/index-browser";

const MissingInputError = new Error(
  "All fields, except for the comment field, are required!",
);
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
  const comment = data.comment;

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

  const orgIdInt = parseInt(organizationId, 10);
  if (Number.isNaN(orgIdInt)) {
    throw InvalidInputError;
  }

  const modelYearsMap = getStringsToModelYearsEnumsMap();
  const complianceYearEnum = modelYearsMap[complianceYear];
  const modelYearEnum = modelYearsMap[modelYear];
  const vehicleClassMap = getStringsToVehicleClassEnumsMap();
  const vehicleClassEnum = vehicleClassMap[vehicleClass];
  const zevClassMap = getStringsToZevClassEnumsMap();
  const zevClassEnum = zevClassMap[zevClass];

  if (
    !complianceYearEnum ||
    !modelYearEnum ||
    !vehicleClassEnum ||
    !zevClassEnum
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
    complianceYear: complianceYearEnum,
    vehicleClass: vehicleClassEnum,
    zevClass: zevClassEnum,
    modelYear: modelYearEnum,
    numberOfUnits,
    comment: comment === "" ? undefined : comment,
  };
};
