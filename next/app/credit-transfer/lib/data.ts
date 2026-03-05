import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CreditTransferStatus, Role } from "@/prisma/generated/enums";
import {
  CreditTransferWhereUniqueInput,
  CreditTransferHistoryWhereInput,
  CreditTransferWhereInput,
} from "@/prisma/generated/models";
import { CreditTransferWithRelated } from "./constants";

export const getCreditTransfers = async (): Promise<
  CreditTransferWithRelated[]
> => {
  const { userIsGov, userOrgId, userRoles } = await getUserInfo();
  const whereClause: CreditTransferWhereInput = {};
  if (userIsGov && userRoles.includes(Role.DIRECTOR)) {
    whereClause.creditTransferHistory = {
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
    whereClause.creditTransferHistory = {
      some: {
        userAction: CreditTransferStatus.APPROVED_BY_TRANSFER_TO,
      },
    };
  } else if (!userIsGov) {
    whereClause.OR = [
      { transferFromId: userOrgId },
      { transferToId: userOrgId, status: { not: CreditTransferStatus.DRAFT } },
    ];
  }
  return await prisma.creditTransfer.findMany({
    where: whereClause,
    select: {
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
      creditTransferContent: {
        select: {
          zevClass: true,
          numberOfUnits: true,
          dollarValuePerUnit: true,
        },
      },
      creditTransferHistory: {
        select: {
          userAction: true,
          timestamp: true,
        },
      },
    },
  });
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
      { transferToId: userOrgId, status: { not: CreditTransferStatus.DRAFT } },
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
  if (userIsGov) {
    whereClause.creditTransfer = {
      creditTransferHistory: {
        some: {
          userAction: CreditTransferStatus.APPROVED_BY_TRANSFER_TO,
        },
      },
    };
  } else {
    whereClause.OR = [
      { creditTransfer: { transferFromId: userOrgId } },
      {
        creditTransfer: {
          transferToId: userOrgId,
          status: { not: CreditTransferStatus.DRAFT },
        },
      },
    ];
    whereClause.userAction = {
      notIn: [
        CreditTransferStatus.RECOMMEND_APPROVAL_GOV,
        CreditTransferStatus.RECOMMEND_REJECTION_GOV,
        CreditTransferStatus.RETURNED_TO_ANALYST,
      ],
    };
  }
  return await prisma.creditTransferHistory.findMany({
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
};
