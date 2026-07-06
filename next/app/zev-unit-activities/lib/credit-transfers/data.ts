import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CreditTransferStatus, Role, ZevClass } from "@/prisma/generated/enums";
import {
  CreditTransferWhereUniqueInput,
  CreditTransferHistoryWhereInput,
  CreditTransferWhereInput,
} from "@/prisma/generated/models";
import { CreditTransferWithRelated } from "./constants";
import { getReportableBalanceAB } from "@/app/zev-unit-activities/lib/zev-unit-transactions/data";
import Decimal from "decimal.js";

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

export const getProjectedBalanceAfterTransfer = async (
  transferId: number,
): Promise<{ A: string; B: string } | null> => {
  const { userOrgId } = await getUserInfo();

  const transfer = await prisma.creditTransfer.findUnique({
    where: { id: transferId },
    select: {
      transferFromId: true,
      creditTransferContent: {
        select: {
          zevClass: true,
          numberOfUnits: true,
        },
      },
    },
  });

  if (!transfer) {
    return null;
  }

  const balance = await getReportableBalanceAB(transfer.transferFromId);
  if (balance === "deficit") {
    return { A: "0.00", B: "0.00" };
  }

  let aBalance = new Decimal(balance.A);
  let bBalance = new Decimal(balance.B);

  for (const content of transfer.creditTransferContent) {
    if (content.zevClass === ZevClass.A) {
      aBalance = aBalance.minus(content.numberOfUnits);
    } else if (content.zevClass === ZevClass.B) {
      bBalance = bBalance.minus(content.numberOfUnits);
    }
  }

  return {
    A: aBalance.toFixed(2),
    B: bBalance.toFixed(2),
  };
};

