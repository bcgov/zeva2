import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  CreditTransferStatus,
  CreditTransferSupplierStatus,
  Role,
} from "@/prisma/generated/enums";
import {
  CreditTransferWhereUniqueInput,
  CreditTransferHistoryWhereInput,
} from "@/prisma/generated/models";
import { getOrderByClause, getWhereClause } from "./utils";

export type CreditTransferSparse = {
  id: number;
  status: CreditTransferStatus;
  supplierStatus: CreditTransferSupplierStatus;
  transferFrom: {
    name: string;
  };
  transferTo: {
    name: string;
  };
};

// page is 1-based
// currently, this function is not used with SSR, so it is important to select only the data you need!
export const getCreditTransfers = async (
  page: number,
  pageSize: number,
  filters: Record<string, string>,
  sorts: Record<string, string>,
): Promise<[CreditTransferSparse[], number]> => {
  const { userIsGov, userOrgId, userRoles } = await getUserInfo();
  const skip = (page - 1) * pageSize;
  const take = pageSize;
  const select = {
    id: true,
    status: true,
    supplierStatus: true,
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
  const where = getWhereClause(filters, userIsGov);
  const orderBy = getOrderByClause(sorts, true, userIsGov);
  if (userIsGov && userRoles.includes(Role.DIRECTOR)) {
    where.creditTransferHistory = {
      some: {
        userAction: {
          in: [
            CreditTransferStatus.RECOMMEND_APPROVAL_GOV,
            CreditTransferStatus.RECOMMEND_REJECTION_GOV,
          ],
        },
      },
    };
  } else if (userIsGov && userRoles.includes(Role.ZEVA_IDIR_USER)) {
    where.creditTransferHistory = {
      some: {
        userAction: CreditTransferStatus.APPROVED_BY_TRANSFER_TO,
      },
    };
  } else if (!userIsGov) {
    where.OR = [{ transferFromId: userOrgId }, { transferToId: userOrgId }];
  }
  return await prisma.$transaction([
    prisma.creditTransfer.findMany({
      skip,
      take,
      select,
      where,
      orderBy,
    }),
    prisma.creditTransfer.count({
      where,
    }),
  ]);
};

export const getCreditTransfer = async (id: number) => {
  const { userIsGov, userOrgId } = await getUserInfo();
  const whereClause: CreditTransferWhereUniqueInput = { id };
  if (userIsGov) {
    whereClause.creditTransferHistory = {
      some: {
        userAction: CreditTransferStatus.APPROVED_BY_TRANSFER_TO,
      },
    };
  } else {
    whereClause.OR = [
      { transferFromId: userOrgId },
      { transferToId: userOrgId },
    ];
  }
  return await prisma.creditTransfer.findUnique({
    where: whereClause,
    include: {
      creditTransferContent: true,
      transferFrom: true,
      transferTo: true,
    },
  });
};

export const getCreditTransferHistories = async (transferId: number) => {
  const { userIsGov, userOrgId } = await getUserInfo();
  const whereClause: CreditTransferHistoryWhereInput = {
    creditTransferId: transferId,
  };
  if (!userIsGov) {
    whereClause.OR = [
      { creditTransfer: { transferFromId: userOrgId } },
      { creditTransfer: { transferToId: userOrgId } },
    ];
  }
  const histories = await prisma.creditTransferHistory.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          organization: {
            select: {
              isGovernment: true,
            },
          },
        },
      },
    },
    orderBy: {
      timestamp: "asc",
    },
  });
  if (!userIsGov) {
    const supplierStatuses = Object.values(CreditTransferSupplierStatus);
    return histories.filter((history) =>
      supplierStatuses.some((status) => status === history.userAction),
    );
  }
  const index = histories.findIndex(
    (history) =>
      history.userAction === CreditTransferStatus.APPROVED_BY_TRANSFER_TO,
  );
  if (index > -1) {
    return histories.slice(index);
  }
  return [];
};
