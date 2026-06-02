import { getAdjacentYear } from "@/app/lib/utils/complianceYear";
import { ModelYear } from "@/prisma/generated/enums";
import { PenaltyCreditWithOrgName } from "./data";
import { getModelYearEnumsToStringsMap } from "@/app/lib/utils/enumMaps";

export const getPenaltyCreditTransactionDate = (complianceYear: ModelYear) => {
  const nextMy = getAdjacentYear("next", complianceYear);
  const map = getModelYearEnumsToStringsMap();
  const nextYear = map[nextMy];
  return new Date(`${nextYear}-${process.env.BEGINNING_OF_COMPLIANCE_YEAR}`);
};

export const getSerializedPenaltyCredit = (
  penaltyCredit: PenaltyCreditWithOrgName,
) => {
  const { numberOfUnits, ...rest } = penaltyCredit;
  return {
    ...rest,
    numberOfunits: numberOfUnits.toFixed(2),
  };
};
