import { getStringsToModelYearsEnumsMap } from "@/app/lib/utils/enumMaps";
import { PenaltyCreditPayload } from "./actions";
import { prisma } from "@/lib/prisma";
import {
  BalanceType,
  ModelYear,
  PenaltyCreditStatus,
} from "@/prisma/generated/client";
import { TransactionClient } from "@/types/prisma";
import { parseComplianceYear } from "./utils";

export const validatePenaltyCredit = async (data: PenaltyCreditPayload) => {
  const {
    organizationId,
    complianceYear,
    vehicleClass,
    zevClass,
    modelYear,
    numberOfUnits,
  } = { ...data };
  const [complianceYearString, complianceYearInt] =
    parseComplianceYear(complianceYear);
  const greaterYears = Object.values(ModelYear).filter(
    (my) => my > complianceYear,
  );
  const endingBalances = await prisma.zevUnitEndingBalance.findMany({
    where: {
      organizationId,
      complianceYear: {
        in: greaterYears,
      },
    },
  });
  if (endingBalances.length > 0) {
    throw new Error(`Issuing penalty credits associated with the ${complianceYearString} 
        compliance year for this supplier is not currently possible because this supplier 
        has been issued an assessment for a greater compliance year.`);
  }
  const correspondingDeficit = await prisma.zevUnitEndingBalance.findFirst({
    where: {
      organizationId,
      type: BalanceType.DEBIT,
      complianceYear,
      vehicleClass,
      zevClass,
      modelYear,
      finalNumberOfUnits: numberOfUnits,
    },
  });
  if (!correspondingDeficit) {
    throw new Error("No corresponding deficit!");
  }
  const modelYearsStringToEnumsMap = getStringsToModelYearsEnumsMap();
  const prevYearString = (complianceYearInt - 1).toString();
  const prevYearEnum = modelYearsStringToEnumsMap[prevYearString];
  if (!prevYearEnum) {
    throw new Error("Invalid previous compliance year!");
  }
  const prevDeficit = await prisma.zevUnitEndingBalance.findFirst({
    where: {
      organizationId,
      type: BalanceType.DEBIT,
      vehicleClass,
      complianceYear: prevYearEnum,
    },
  });
  if (!prevDeficit) {
    throw new Error(
      "Error; please see section 10(4) of the relevant legislation.",
    );
  }
};

export const createHistory = async (
  penaltyCreditId: number,
  userId: number,
  userAction: PenaltyCreditStatus,
  comment?: string,
  transactionClient?: TransactionClient,
) => {
  const client = transactionClient ?? prisma;
  await client.penaltyCreditHistory.create({
    data: {
      penaltyCreditId,
      userId,
      userAction,
      comment,
    },
  });
};
