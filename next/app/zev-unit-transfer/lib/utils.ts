import {
  ZevUnitTransferContent,
  ZevUnitTransferStatuses,
} from "@/prisma/generated/client";
import { ZevUnitTransferContentPayload } from "./actions";
import { Decimal } from "@prisma/client/runtime/library";
import {
  isVehicleClass,
  isZevClass,
  isModelYear,
  isZevUnitTransferStatus,
} from "@/app/lib/utils/typeGuards";
import { Prisma } from "@/prisma/generated/client";

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

export type FilterableFields = {
  id?: string;
  status?: string;
  transferTo?: string;
  transferFrom?: string;
};

export const getWhereClause = (
  filters: FilterableFields,
): Prisma.ZevUnitTransferWhereInput => {
  const result: Prisma.ZevUnitTransferWhereInput = {};
  for (const [key, value] of Object.entries(filters)) {
    if (key === "id") {
      result[key] = parseInt(value, 10);
    } else if (key === "status") {
      // maybe consider using something like https://www.npmjs.com/package/string-similarity ?
      const statuses = Object.keys(ZevUnitTransferStatuses);
      const x = value.replaceAll(" ", "").toLowerCase();
      const matches = statuses.filter((s) => {
        const ns = s.replaceAll("_", "").toLowerCase();
        return ns.includes(x);
      });
      result.OR = [];
      if (matches.length > 0) {
        for (const match of matches) {
          if (isZevUnitTransferStatus(match)) {
            result.OR.push({ status: match });
          }
        }
      } else {
        result.OR.push({ id: -1 });
      }
    } else if (key === "transferFrom" || key === "transferTo") {
      result[key] = {
        is: { name: { contains: value, mode: "insensitive" } },
      };
    }
  }
  return result;
};

export type SortableFields = {
  id?: Prisma.SortOrder;
  status?: Prisma.SortOrder;
  transferTo?: Prisma.SortOrder;
  transferFrom?: Prisma.SortOrder;
};

export const getOrderByClause = (
  sorts: SortableFields,
  defaultSortById: boolean,
): Prisma.ZevUnitTransferOrderByWithRelationInput[] => {
  const result: Prisma.ZevUnitTransferOrderByWithRelationInput[] = [];
  for (const [key, value] of Object.entries(sorts)) {
    if (key === "id" || key === "status") {
      result.push({ [key]: value });
    } else if (key === "transferTo" || key === "transferFrom") {
      result.push({ [key]: { name: value } });
    }
  }
  if (defaultSortById && result.length === 0) {
    result.push({ id: "desc" });
  }
  return result;
};
