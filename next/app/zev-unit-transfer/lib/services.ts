import { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  ZevUnitTransferHistoryUserActions,
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
import { getCompliancePeriod } from "@/app/lib/utils/complianceYear";
import { ZevUnitTransferContentPayload } from "./actions";
import { getModelYearEnumMap } from "@/app/lib/utils/enumMaps";

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
  status: ZevUnitTransferStatuses & ZevUnitTransferHistoryUserActions,
  comment: string | null,
  transactionClient?: PrismaClient,
) => {
  const prismaClient = transactionClient ?? prisma;
  await updateTransferStatus(transferId, status, prismaClient);
  await createTransferHistory(
    {
      zevUnitTransferId: transferId,
      userId: userId,
      userAction: status,
      comment: comment,
    },
    prismaClient,
  );
};

export const transferIsCovered = async (
  transfer: ZevUnitTransferWithContent,
) => {
  let result = true;
  const mostRecentComplianceYearWithEndingBalances =
    await prisma.zevUnitEndingBalance.findFirst({
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
  if (mostRecentComplianceYearWithEndingBalances) {
    const complianceYear =
      mostRecentComplianceYearWithEndingBalances.complianceYear;
    const modelYearsMap = getModelYearEnumMap();
    const complianceYearNumber = parseInt(modelYearsMap[complianceYear] ?? "");
    if (Number.isNaN(complianceYearNumber)) {
      throw new Error("unknown model year!");
    }
    const compliancePeriod = getCompliancePeriod(complianceYearNumber);
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
