import { ZevUnitTransferContent } from "@/prisma/generated/client";
import { ZevUnitTransferContentPayload } from "./actions";
import { Decimal } from "@prisma/client/runtime/library";
import {
  isVehicleClass,
  isZevClass,
  isModelYear,
} from "@/app/lib/utils/typeGuards";

// throws error if invalid; otherwise, returns ZevUnitTransferContent[]
export const getValidatedTransferContent = (
  transferContent: ZevUnitTransferContentPayload[],
  transferId: number,
) => {
  const contentToBeAdded: Omit<ZevUnitTransferContent, "id">[] = [];
  for (const content of transferContent) {
    const vehicleClass = content.vehicleClass;
    const zevClass = content.zevClass;
    const modelYear = content.modelYear;
    const numberOfUnits = new Decimal(content.numberOfUnits);
    const dollarValuePerUnit = new Decimal(content.dollarValuePerUnit);
    if (
      isVehicleClass(vehicleClass) &&
      isZevClass(zevClass) &&
      isModelYear(modelYear) &&
      numberOfUnits.decimalPlaces() <= 2 &&
      dollarValuePerUnit.decimalPlaces() <= 2
    ) {
      contentToBeAdded.push({
        vehicleClass,
        zevClass,
        modelYear,
        numberOfUnits,
        dollarValuePerUnit,
        zevUnitTransferId: transferId,
      });
    } else {
      throw new Error();
    }
  }
  const contentToBeAddedLength = contentToBeAdded.length;
  if (
    contentToBeAddedLength === 0 ||
    contentToBeAddedLength !== transferContent.length
  ) {
    throw new Error();
  }
  return contentToBeAdded;
};
