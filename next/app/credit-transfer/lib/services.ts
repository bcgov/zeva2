import { prisma } from "@/lib/prisma";
import {
  TransactionType,
  CreditTransferStatus,
  Prisma,
  CreditTransfer,
  CreditTransferContent,
  CreditTransferSupplierStatus,
} from "@/prisma/generated/client";
import {
  applyTransfersAway,
  getZevUnitRecords,
  UncoveredTransfer,
  ZevUnitRecord,
} from "@/lib/utils/zevUnit";
import { getCompliancePeriod } from "@/app/lib/utils/complianceYear";
import { TransactionClient } from "@/types/prisma";

export const getTransfer = async (transferId: number) => {
  return await prisma.creditTransfer.findUnique({
    where: {
      id: transferId,
    },
  });
};

export type CreditTransferHistoryCreateData = Omit<
  Prisma.CreditTransferHistoryUncheckedCreateInput,
  "id" | "timestamp"
>;

export const createTransferHistory = async (
  data: CreditTransferHistoryCreateData,
  transactionClient?: TransactionClient,
): Promise<number> => {
  const prismaClient = transactionClient ?? prisma;
  const history = await prismaClient.creditTransferHistory.create({
    data: data,
  });
  return history.id;
};

export const updateTransferStatus = async (
  transferId: number,
  status: CreditTransferStatus,
  supplierStatus: CreditTransferSupplierStatus,
  transactionClient?: TransactionClient,
) => {
  const prismaClient = transactionClient ?? prisma;
  await prismaClient.creditTransfer.update({
    where: {
      id: transferId,
    },
    data: {
      status,
      supplierStatus,
    },
  });
};

export const updateTransferStatusAndCreateHistory = async (
  transferId: number,
  userId: number,
  status: CreditTransferStatus,
  supplierStatus: CreditTransferSupplierStatus,
  comment?: string,
  transactionClient?: TransactionClient,
): Promise<number> => {
  const prismaClient = transactionClient ?? prisma;
  await updateTransferStatus(transferId, status, supplierStatus, prismaClient);
  const historyId = await createTransferHistory(
    {
      creditTransferId: transferId,
      userId: userId,
      userAction: status,
      comment: comment,
    },
    prismaClient,
  );
  return historyId;
};

export type CreditTransferWithContent = CreditTransfer & {
  creditTransferContent: CreditTransferContent[];
};

export const transferIsCovered = async (
  transfer: CreditTransferWithContent,
) => {
  let result = true;
  const endingBalanceRecord = await prisma.zevUnitEndingBalance.findFirst({
    where: {
      organizationId: transfer.transferFromId,
    },
    select: {
      complianceYear: true,
    },
    orderBy: {
      complianceYear: "desc",
    },
  });
  const zevUnitRecords: ZevUnitRecord[] = [];
  if (endingBalanceRecord) {
    const complianceYear = endingBalanceRecord.complianceYear;
    const compliancePeriod = getCompliancePeriod(complianceYear);
    const endingBalances = await prisma.zevUnitEndingBalance.findMany({
      where: {
        organizationId: transfer.transferFromId,
        complianceYear: complianceYear,
      },
    });
    const transactions = await prisma.zevUnitTransaction.findMany({
      where: {
        organizationId: transfer.transferFromId,
        timestamp: {
          gte: compliancePeriod.closedLowerBound,
        },
      },
    });
    zevUnitRecords.push(...getZevUnitRecords(endingBalances), ...transactions);
  } else {
    const transactions = await prisma.zevUnitTransaction.findMany({
      where: {
        organizationId: transfer.transferFromId,
      },
    });
    zevUnitRecords.push(...transactions);
  }
  for (const item of transfer.creditTransferContent) {
    zevUnitRecords.push({
      ...item,
      type: TransactionType.TRANSFER_AWAY,
    });
  }
  try {
    applyTransfersAway(zevUnitRecords);
  } catch (e) {
    if (e instanceof UncoveredTransfer) {
      result = false;
    } else {
      throw e;
    }
  }
  return result;
};
