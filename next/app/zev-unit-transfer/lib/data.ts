import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  Organization,
  User,
  ZevUnitTransfer,
  ZevUnitTransferCommentType,
  ZevUnitTransferContent,
  ZevUnitTransferHistory,
  ZevUnitTransferStatuses,
} from "@/prisma/generated/client";
import { visibleToSupplierHistoryStatuses } from "./constants";

export type ZevUnitTransferWithContentAndOrgs = {
  zevUnitTransferContent: ZevUnitTransferContent[];
  transferFrom: Organization;
  transferTo: Organization;
} & ZevUnitTransfer;

export const getZevUnitTransfers = async (): Promise<
  ZevUnitTransferWithContentAndOrgs[]
> => {
  const { userIsGov, userOrgId } = await getUserInfo();
  if (userIsGov) {
    return await prisma.zevUnitTransfer.findMany({
      where: {
        ZevUnitTransferHistory: {
          some: {
            afterUserActionStatus:
              ZevUnitTransferStatuses.APPROVED_BY_TRANSFER_TO,
          },
        },
      },
      include: {
        zevUnitTransferContent: true,
        transferFrom: true,
        transferTo: true,
      },
    });
  } else {
    return await prisma.zevUnitTransfer.findMany({
      where: {
        OR: [
          { transferFromId: userOrgId },
          {
            transferToId: userOrgId,
            status: {
              notIn: [
                ZevUnitTransferStatuses.DRAFT,
                ZevUnitTransferStatuses.DELETED,
              ],
            },
          },
        ],
      },
      include: {
        zevUnitTransferContent: true,
        transferFrom: true,
        transferTo: true,
      },
    });
  }
};

export const getZevUnitTransfer = async (
  id: number,
): Promise<ZevUnitTransferWithContentAndOrgs | null> => {
  const { userIsGov, userOrgId } = await getUserInfo();
  if (userIsGov) {
    return await prisma.zevUnitTransfer.findUnique({
      where: {
        id: id,
        ZevUnitTransferHistory: {
          some: {
            afterUserActionStatus:
              ZevUnitTransferStatuses.APPROVED_BY_TRANSFER_TO,
          },
        },
      },
      include: {
        zevUnitTransferContent: true,
        transferFrom: true,
        transferTo: true,
      },
    });
  } else {
    const transfer = await prisma.zevUnitTransfer.findUnique({
      where: {
        id: id,
      },
      include: {
        zevUnitTransferContent: true,
        transferFrom: true,
        transferTo: true,
      },
    });
    if (transfer) {
      if (transfer.transferFromId === userOrgId) {
        return transfer;
      } else if (
        transfer.transferToId === userOrgId &&
        transfer.status !== ZevUnitTransferStatuses.DRAFT &&
        transfer.status !== ZevUnitTransferStatuses.DELETED
      ) {
        return transfer;
      }
    }
  }
  return null;
};

export type ZevUnitTransferHistoryWithUser = ZevUnitTransferHistory & {
  user: User;
};

export const getZevUnitTransferHistories = async (
  transferId: number,
): Promise<ZevUnitTransferHistoryWithUser[]> => {
  const { userIsGov, userOrgId } = await getUserInfo();
  if (userIsGov) {
    const transfer = await prisma.zevUnitTransfer.findUnique({
      where: {
        id: transferId,
        ZevUnitTransferHistory: {
          some: {
            afterUserActionStatus:
              ZevUnitTransferStatuses.APPROVED_BY_TRANSFER_TO,
          },
        },
      },
      include: {
        zevUnitTransferContent: true,
        ZevUnitTransferHistory: {
          include: {
            user: true,
          },
        },
      },
    });
    if (transfer) {
      return transfer.ZevUnitTransferHistory;
    }
  } else {
    const histories = await prisma.zevUnitTransferHistory.findMany({
      where: {
        zevUnitTransferId: transferId,
      },
      include: {
        zevUnitTransfer: true,
        user: true,
      },
      orderBy: {
        timestamp: "asc",
      },
    });
    if (histories.length > 0) {
      const transfer = histories[0].zevUnitTransfer;
      if (
        transfer.transferFromId === userOrgId ||
        transfer.transferToId === userOrgId
      ) {
        return histories.filter((history) => {
          return visibleToSupplierHistoryStatuses.some((status) => {
            return history.afterUserActionStatus === status;
          });
        });
      }
    }
  }
  return [];
};

export const getZevUnitTransferComments = async (transferId: number) => {
  const { userIsGov, userOrgId } = await getUserInfo();
  if (userIsGov) {
    return await prisma.zevUnitTransferComment.findMany({
      where: {
        zevUnitTransferId: transferId,
        commentType: ZevUnitTransferCommentType.INTERNAL_GOV,
      },
      include: {
        user: true,
      },
    });
  }
  return await prisma.zevUnitTransferComment.findMany({
    where: {
      zevUnitTransferId: transferId,
      commentType: ZevUnitTransferCommentType.TO_COUNTERPARTY_UPON_RESCIND,
      zevUnitTransfer: {
        OR: [{ transferFromId: userOrgId }, { transferToId: userOrgId }],
      },
    },
    include: { user: true },
  });
};

export type orgIdAndName = {
  id: number;
  name: string;
};

export const getOrgIdsAndNames = async (): Promise<orgIdAndName[]> => {
  // no need for auth checks additional to what's in middleware
  return await prisma.organization.findMany({
    where: {
      isGovernment: false,
    },
    select: {
      id: true,
      name: true,
    },
  });
};
