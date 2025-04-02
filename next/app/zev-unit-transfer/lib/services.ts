import { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  ZevUnitTransferHistoryStatuses,
  ZevUnitTransferStatuses,
  ZevUnitTransferHistory,
  ZevUnitTransfer,
  ZevUnitTransferContent,
  TransactionType,
} from "@/prisma/generated/client";
import {
  applyTransfersAway,
  getZevUnitRecords,
  UncoveredTransfer,
  ZevUnitRecord,
} from "@/lib/utils/zevUnit";
import {
  getCompliancePeriod,
  getCurrentComplianceYear,
} from "@/app/lib/utils/complianceYear";
import { getModelYearEnum } from "@/lib/utils/getEnums";

export const getTransfer = async (transferId: number) => {
  return await prisma.zevUnitTransfer.findUnique({
    where: {
      id: transferId,
    },
  });
};

export type ZevUnitTransferWithContent = ZevUnitTransfer & {
  zevUnitTransferContent: ZevUnitTransferContent[];
};

export const getTransferWithContent = async (
  transferId: number,
): Promise<ZevUnitTransferWithContent | null> => {
  return await prisma.zevUnitTransfer.findUnique({
    where: {
      id: transferId,
    },
    include: {
      zevUnitTransferContent: true,
    },
  });
};

export type TransferHistoryType = Omit<
  ZevUnitTransferHistory,
  "id" | "timestamp"
>;

export const createTransferHistory = async (
  data: TransferHistoryType,
  transactionClient?: PrismaClient,
) => {
  const prismaClient = transactionClient ?? prisma;
  await prismaClient.zevUnitTransferHistory.create({
    data: data,
  });
};

export const updateTransferStatus = async (
  transferId: number,
  status: ZevUnitTransferStatuses,
  transactionClient?: PrismaClient,
) => {
  const prismaClient = transactionClient ?? prisma;
  await prismaClient.zevUnitTransfer.update({
    where: {
      id: transferId,
    },
    data: {
      status: status,
    },
  });
};

export const updateTransferStatusAndCreateHistory = async (
  transferId: number,
  userId: number,
  status: ZevUnitTransferHistoryStatuses,
  transactionClient?: PrismaClient,
) => {
  const prismaClient = transactionClient ?? prisma;
  await updateTransferStatus(transferId, status, prismaClient);
  await createTransferHistory(
    {
      zevUnitTransferId: transferId,
      userId: userId,
      afterUserActionStatus: status,
    },
    prismaClient,
  );
};

export const transferIsCovered = async (
  transfer: ZevUnitTransferWithContent,
) => {
  let result = true;
  const complianceYear = getCurrentComplianceYear();
  const compliancePeriod = getCompliancePeriod(complianceYear);
  const endingBalances = await prisma.zevUnitEndingBalance.findMany({
    where: {
      organizationId: transfer.transferFromId,
      complianceYear: getModelYearEnum(complianceYear),
    },
  });
  const transactions = await prisma.zevUnitTransaction.findMany({
    where: {
      organizationId: transfer.transferFromId,
      timestamp: {
        gte: compliancePeriod.closedLowerBound,
        lt: compliancePeriod.openUpperBound,
      },
    },
  });
  const zevUnitRecords: ZevUnitRecord[] = [];
  zevUnitRecords.push(...getZevUnitRecords(endingBalances), ...transactions);
  for (const item of transfer.zevUnitTransferContent) {
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
