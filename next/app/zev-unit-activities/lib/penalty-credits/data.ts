import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ModelYear, PenaltyCreditStatus, Role } from "@/prisma/generated/enums";
import {
  PenaltyCreditModel,
  PenaltyCreditHistoryModel,
  PenaltyCreditWhereInput,
  PenaltyCreditHistoryWhereInput,
  PenaltyCreditWhereUniqueInput,
} from "@/prisma/generated/models";

export type OrgNamesAndIds = {
  id: number;
  name: string;
};

export type PenaltyCreditWithOrgName = PenaltyCreditModel & {
  organization: { name: string };
};

export const getPenaltyCredit = async (
  penaltyCreditId: number,
): Promise<PenaltyCreditWithOrgName | null> => {
  const { userIsGov, userOrgId, userRoles } = await getUserInfo();
  const where: PenaltyCreditWhereUniqueInput = {
    id: penaltyCreditId,
  };
  if (userIsGov && userRoles.includes(Role.DIRECTOR)) {
    where.status = {
      in: [
        PenaltyCreditStatus.APPROVED,
        PenaltyCreditStatus.SUBMITTED_TO_DIRECTOR,
      ],
    };
  } else if (!userIsGov) {
    where.organizationId = userOrgId;
    where.status = PenaltyCreditStatus.APPROVED;
  }
  return await prisma.penaltyCredit.findUnique({
    where,
    include: {
      organization: {
        select: {
          name: true,
        },
      },
    },
  });
};

export type PenaltyCreditHistoryWithUser = PenaltyCreditHistoryModel & {
  user: {
    firstName: string;
    lastName: string;
    organization: { isGovernment: boolean };
  };
};

export const getPenaltyCreditHistories = async (
  penaltyCreditId: number,
): Promise<PenaltyCreditHistoryWithUser[]> => {
  const { userIsGov, userOrgId, userRoles } = await getUserInfo();
  const where: PenaltyCreditHistoryWhereInput = {
    penaltyCreditId,
  };
  if (userIsGov && userRoles.includes(Role.DIRECTOR)) {
    where.penaltyCredit = {
      status: {
        in: [
          PenaltyCreditStatus.APPROVED,
          PenaltyCreditStatus.SUBMITTED_TO_DIRECTOR,
        ],
      },
    };
  } else if (!userIsGov) {
    where.penaltyCredit = {
      organizationId: userOrgId,
      status: PenaltyCreditStatus.APPROVED,
    };
    where.userAction = PenaltyCreditStatus.APPROVED;
  }
  return await prisma.penaltyCreditHistory.findMany({
    where,
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

export const getPenaltyCredits = async (): Promise<PenaltyCreditSparse[]> => {
  const { userIsGov, userOrgId, userRoles } = await getUserInfo();
  const where: PenaltyCreditWhereInput = {};
  if (userIsGov && userRoles.includes(Role.DIRECTOR)) {
    where.status = {
      in: [
        PenaltyCreditStatus.APPROVED,
        PenaltyCreditStatus.SUBMITTED_TO_DIRECTOR,
      ],
    };
  } else if (!userIsGov) {
    where.organizationId = userOrgId;
    where.status = PenaltyCreditStatus.APPROVED;
  }
  return await prisma.penaltyCredit.findMany({
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
  });
};
