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
import { ZevUnitTransferContentPayload } from "./actions";

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
  comment: string | null,
  transactionClient?: PrismaClient,
) => {
  const prismaClient = transactionClient ?? prisma;
  await updateTransferStatus(transferId, status, prismaClient);
  await createTransferHistory(
    {
      zevUnitTransferId: transferId,
      userId: userId,
      afterUserActionStatus: status,
      comment: comment,
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
      complianceYear: getModelYearEnum(complianceYear - 1),
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

export const getSerializableTransferContent = async (transferId: number) => {
  const result: ZevUnitTransferContentPayload[] = [];
  const content = await prisma.zevUnitTransferContent.findMany({
    where: {
      zevUnitTransferId: transferId,
    },
  });
  for (const item of content) {
    result.push({
      vehicleClass: item.vehicleClass,
      zevClass: item.zevClass,
      modelYear: item.modelYear,
      numberOfUnits: item.numberOfUnits.toString(),
      dollarValuePerUnit: item.dollarValuePerUnit.toString(),
    });
  }
  return result;
};
