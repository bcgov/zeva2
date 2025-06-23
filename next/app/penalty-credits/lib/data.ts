import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  ModelYear,
  PenaltyCredit,
  PenaltyCreditHistory,
  PenaltyCreditStatus,
} from "@/prisma/generated/client";
import { getOrderByClause, getWhereClause } from "./utils";

export type OrgNamesAndIds = {
  id: number;
  name: string;
};

export const getOrgNamesAndIds = async (): Promise<OrgNamesAndIds[]> => {
  const { userIsGov } = await getUserInfo();
  if (!userIsGov) {
    throw new Error("Unauthorized!");
  }
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

export type PenaltyCreditWithOrgName = PenaltyCredit & {
  organization: { name: string };
};

export const getPenaltyCredit = async (
  penaltyCreditId: number,
): Promise<PenaltyCreditWithOrgName | null> => {
  const { userIsGov } = await getUserInfo();
  if (!userIsGov) {
    throw new Error("Unauthorized!");
  }
  return await prisma.penaltyCredit.findUnique({
    where: {
      id: penaltyCreditId,
    },
    include: {
      organization: {
        select: {
          name: true,
        },
      },
    },
  });
};

export type PenaltyCreditHistoryWithUser = PenaltyCreditHistory & {
  user: { firstName: string; lastName: string };
};

export const getPenaltyCreditHistories = async (
  penaltyCreditId: number,
): Promise<PenaltyCreditHistoryWithUser[]> => {
  const { userIsGov } = await getUserInfo();
  if (!userIsGov) {
    throw new Error("Unauthorized!");
  }
  return await prisma.penaltyCreditHistory.findMany({
    where: {
      penaltyCreditId,
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });
};

export type PenaltyCreditSparse = {
  id: number;
  status: PenaltyCreditStatus;
  organization: {
    name: string;
  };
  complianceYear: ModelYear;
};

export const getPenaltyCredits = async (
  page: number,
  pageSize: number,
  filters: Record<string, string>,
  sorts: Record<string, string>,
): Promise<[PenaltyCreditSparse[], number]> => {
  const { userIsGov } = await getUserInfo();
  if (!userIsGov) {
    throw new Error("Unauthorized!");
  }
  const skip = (page - 1) * pageSize;
  const take = pageSize;
  const where = getWhereClause(filters);
  const orderBy = getOrderByClause(sorts, true);
  return await prisma.$transaction([
    prisma.penaltyCredit.findMany({
      skip,
      take,
      where,
      select: {
        id: true,
        status: true,
        complianceYear: true,
        organization: {
          select: {
            name: true,
          },
        },
      },
      orderBy,
    }),
    prisma.penaltyCredit.count({
      where,
    }),
  ]);
};
