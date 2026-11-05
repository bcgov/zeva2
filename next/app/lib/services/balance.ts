import { prisma } from "@/lib/prisma";
import {
  getBalance,
  getSignedBalance,
  UnexpectedDebit,
} from "@/lib/utils/zevUnit";
import { ModelYear } from "@/prisma/generated/enums";
import {
  ZevUnitEndingBalanceModel,
  ZevUnitTransactionModel,
  ZevUnitTransactionWhereInput,
} from "@/prisma/generated/models";
import { getCompliancePeriod } from "../utils/complianceYear";

export const getTransactions = async (
  orgId: number,
  gteDate?: Date,
): Promise<ZevUnitTransactionModel[]> => {
  const where: ZevUnitTransactionWhereInput = {
    organizationId: orgId,
  };
  if (gteDate) {
    where.timestamp = { gte: gteDate };
  }
  return prisma.zevUnitTransaction.findMany({
    where,
    orderBy: { modelYear: "asc" },
  });
};

export const getEndingBalances = async (
  orgId: number,
  complianceYear: ModelYear,
): Promise<ZevUnitEndingBalanceModel[]> => {
  return prisma.zevUnitEndingBalance.findMany({
    where: {
      organizationId: orgId,
      complianceYear: complianceYear,
    },
  });
};

const getBalanceInputs = async (orgId: number) => {
  const mostRecentEndingBalance = await prisma.zevUnitEndingBalance.findFirst({
    where: {
      organizationId: orgId,
    },
    select: {
      complianceYear: true,
    },
    orderBy: [{ complianceYear: "desc" }],
  });
  if (mostRecentEndingBalance) {
    const complianceYear = mostRecentEndingBalance.complianceYear;
    const { openUpperBound: gteDate } = getCompliancePeriod(complianceYear);
    const endingBalances = await getEndingBalances(orgId, complianceYear);
    const transactions = await getTransactions(orgId, gteDate);
    return { endingBalances, transactions };
  }
  const transactions = await getTransactions(orgId);
  return { endingBalances: [], transactions };
};

export const getOrgBalance = async (orgId: number) => {
  const { endingBalances, transactions } = await getBalanceInputs(orgId);
  try {
    return getBalance(endingBalances, transactions);
  } catch (e) {
    if (e instanceof UnexpectedDebit) {
      return "deficit";
    }
    throw e;
  }
};

export const getOrgSignedBalance = async (orgId: number) => {
  const { endingBalances, transactions } = await getBalanceInputs(orgId);
  return getSignedBalance(endingBalances, transactions);
};
