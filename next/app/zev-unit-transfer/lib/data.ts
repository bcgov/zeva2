import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  Organization,
  User,
  ZevUnitTransfer,
  ZevUnitTransferContent,
  ZevUnitTransferHistory,
  ZevUnitTransferStatuses,
} from "@/prisma/generated/client";
import { visibleToSupplierHistoryUserActions } from "./constants";
import { getOrderByClause, getWhereClause } from "./utils";

export type ZevUnitTransferSparse = {
  id: number;
  status: string;
  transferFrom: {
    name: string;
  };
  transferTo: {
    name: string;
  };
};

// page is 1-based
// currently, this function is not used with SSR, so it is important to select only the data you need!
export const getZevUnitTransfers = async (
  page: number,
  pageSize: number,
  filters: { [key: string]: string },
  sorts: { [key: string]: string },
): Promise<[ZevUnitTransferSparse[], number]> => {
  const { userIsGov, userOrgId } = await getUserInfo();
  const skip = (page - 1) * pageSize;
  const take = pageSize;
  const select = {
    id: true,
    status: true,
    transferFrom: {
      select: {
        name: true,
      },
    },
    transferTo: {
      select: {
        name: true,
      },
    },
  };
  const where = getWhereClause(filters);
  const orderBy = getOrderByClause(sorts, true);
  if (userIsGov) {
    where.zevUnitTransferHistory = {
      some: {
        userAction: ZevUnitTransferStatuses.APPROVED_BY_TRANSFER_TO,
      },
    };
  } else {
    where.AND = [
      { OR: where.OR ?? [] },
      {
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
    ];
  }
  return await prisma.$transaction([
    prisma.zevUnitTransfer.findMany({
      skip,
      take,
      select,
      where,
      orderBy,
    }),
    prisma.zevUnitTransfer.count({
      where,
    }),
  ]);
};

export type ZevUnitTransferWithContentAndOrgs = {
  zevUnitTransferContent: ZevUnitTransferContent[];
  transferFrom: Organization;
  transferTo: Organization;
} & ZevUnitTransfer;

export const getZevUnitTransfer = async (
  id: number,
): Promise<ZevUnitTransferWithContentAndOrgs | null> => {
  const { userIsGov, userOrgId } = await getUserInfo();
  if (userIsGov) {
    return await prisma.zevUnitTransfer.findUnique({
      where: {
        id: id,
        zevUnitTransferHistory: {
          some: {
            userAction:
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
  }
  return await prisma.zevUnitTransfer.findUnique({
    where: {
      id: id,
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
        zevUnitTransferHistory: {
          some: {
            userAction:
              ZevUnitTransferStatuses.APPROVED_BY_TRANSFER_TO,
          },
        },
      },
      include: {
        zevUnitTransferHistory: {
          include: {
            user: true,
          },
          orderBy: {
            timestamp: "asc",
          },
        },
      },
    });
    if (transfer) {
      return transfer.zevUnitTransferHistory;
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
          return visibleToSupplierHistoryUserActions.some((status) => {
            return history.userAction === status;
          });
        });
      }
    }
  }
  return [];
};

export type orgIdAndName = {
  id: number;
  name: string;
};

export const getOrgsMap = async (
  orgIdToExclude: number | null,
  excludeGovOrg: boolean,
) => {
  const result: { [key: number]: string } = {};
  const where: { isGovernment?: false; id?: { not: number } } = {};
  if (excludeGovOrg) {
    where.isGovernment = false;
  }
  if (orgIdToExclude !== null) {
    where.id = { not: orgIdToExclude };
  }
  const orgs = await prisma.organization.findMany({
    where: where,
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });
  for (const org of orgs) {
    result[org.id] = org.name;
  }
  return result;
};
