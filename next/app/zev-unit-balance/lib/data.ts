
import { prisma } from "@/lib/prisma";
import {
  ZevUnitTransaction,
  ZevUnitEndingBalance,
  ModelYear,
  Prisma,
  TransactionType
} from "@/prisma/generated/client";
import { getBalance } from "../../../lib/utils/zevUnit";
import { auth } from "@/auth";

async function assertAccess(orgId: number) {
  const session = await auth();
  if (!session) throw new Error("Unauthenticated");

  const user = session.user
  const isGov = user?.isGovernment
  const isSupplier = user?.organizationId === orgId && !user?.isGovernment;

  if (!isGov && !isSupplier) throw new Error("Unauthorized");
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Not authorized to access this organisation's data");
  }
}

export async function fetchTransactions(
    orgId: number,
    modelYear?: ModelYear
  ): Promise<ZevUnitTransaction[]> {
    await assertAccess(orgId);
  
    const where: Prisma.ZevUnitTransactionWhereInput = { organizationId: orgId, type: { in: [TransactionType.CREDIT, TransactionType.TRANSFER_AWAY] } };
    if (modelYear) where.modelYear = modelYear;
  
    return prisma.zevUnitTransaction.findMany({
      where,
      orderBy: { modelYear: "asc" },
    });
  }
  
  export async function fetchEndingBalances(
    orgId: number,
    modelYear?: ModelYear
  ): Promise<ZevUnitEndingBalance[]> {
    await assertAccess(orgId);
  
    const where: Prisma.ZevUnitEndingBalanceWhereInput = { organizationId: orgId };
    if (modelYear) where.complianceYear = modelYear;
  
    return prisma.zevUnitEndingBalance.findMany({ where });
  }
  
  export async function fetchBalance(orgId: number, modelYear?: ModelYear) {
    const [endingBalances, transactions] = await Promise.all([
      fetchEndingBalances(orgId, modelYear),
      fetchTransactions(orgId, modelYear),
    ]);
  
    return getBalance(endingBalances, transactions);
  }
