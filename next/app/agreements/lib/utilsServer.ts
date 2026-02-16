import { Decimal } from "decimal.js";
import { AgreementContentPayload } from "./actions";
import { ZevClass } from "@/prisma/generated/enums";
import {
  getMatchingTerms,
  getStringsToAgreementStatusEnumsMap,
  getStringsToAgreementTypeEnumsMap,
} from "@/app/lib/utils/enumMaps";
import { AgreementWithOrgName } from "./data";
import { ZevUnitRecord } from "@/lib/utils/zevUnit";
import {
  AgreementWhereInput,
  AgreementOrderByWithRelationInput,
} from "@/prisma/generated/models";

export const getCreditsSum = (content: AgreementContentPayload[]) => {
  let aCredits = new Decimal(0);
  let bCredits = new Decimal(0);
  for (const record of content) {
    const zevClass = record.zevClass;
    const numberOfUnits = new Decimal(record.numberOfUnits);
    if (zevClass === ZevClass.A) {
      aCredits = aCredits.plus(numberOfUnits);
    } else if (zevClass === ZevClass.B) {
      bCredits = bCredits.plus(numberOfUnits);
    }
  }
  return {
    aCredits,
    bCredits,
  };
};

export const getWhereClause = (
  filters: Record<string, string>,
): Omit<AgreementWhereInput, "NOT"> => {
  const result: Omit<AgreementWhereInput, "NOT"> = {};
  const statusMap = getStringsToAgreementStatusEnumsMap();
  const typeMap = getStringsToAgreementTypeEnumsMap();
  for (const [key, rawValue] of Object.entries(filters)) {
    const value = rawValue.trim();
    if (key === "id") {
      result[key] = Number.parseInt(value, 10);
    } else if (key === "organization") {
      result[key] = {
        is: { name: { contains: value, mode: "insensitive" } },
      };
    } else if (key === "status") {
      result[key] = {
        in: getMatchingTerms(statusMap, value),
      };
    } else if (key === "agreementType") {
      result[key] = {
        in: getMatchingTerms(typeMap, value),
      };
    } else if (key === "date" || key === "aCredits" || key === "bCredits") {
      result[key] = value;
    }
  }
  return result;
};

export const getOrderByClause = (
  sorts: Record<string, string>,
  defaultSortById: boolean,
): AgreementOrderByWithRelationInput[] => {
  const result: AgreementOrderByWithRelationInput[] = [];
  for (const [key, value] of Object.entries(sorts)) {
    const orderBy: AgreementOrderByWithRelationInput = {};
    if (value === "asc" || value === "desc") {
      if (
        key === "id" ||
        key === "status" ||
        key === "agreementType" ||
        key === "date" ||
        key === "aCredits" ||
        key === "bCredits"
      ) {
        orderBy[key] = value;
      } else if (key === "organization") {
        orderBy[key] = {
          name: value,
        };
      }
    }
    if (Object.keys(orderBy).length > 0) {
      result.push(orderBy);
    }
  }
  if (defaultSortById && result.length === 0) {
    result.push({ id: "desc" });
  }
  return result;
};

export type AgreementWithOrgNameSerialized = Omit<
  AgreementWithOrgName,
  "aCredits" | "bCredits"
> & { aCredits: string; bCredits: string };

export const getSerializedAgreements = (agreements: AgreementWithOrgName[]) => {
  const result: AgreementWithOrgNameSerialized[] = [];
  for (const agreement of agreements) {
    result.push({
      ...agreement,
      aCredits: agreement.aCredits.toFixed(2),
      bCredits: agreement.bCredits.toFixed(2),
    });
  }
  return result;
};

export const getSerializedAgreementContent = (
  content: Omit<ZevUnitRecord, "type">[],
) => {
  const result: (Omit<ZevUnitRecord, "type" | "numberOfUnits"> & {
    numberOfUnits: string;
  })[] = [];
  for (const record of content) {
    result.push({
      ...record,
      numberOfUnits: record.numberOfUnits.toFixed(2),
    });
  }
  return result;
};
