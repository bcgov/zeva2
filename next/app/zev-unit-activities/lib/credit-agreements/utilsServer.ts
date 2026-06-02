import { Decimal } from "decimal.js";
import { ZevClass } from "@/prisma/generated/enums";
import { AgreementWithOrgName } from "./data";
import { ZevUnitRecord } from "@/lib/utils/zevUnit";
import { AgreementContentPayload } from "./constants";

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
