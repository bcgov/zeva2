import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AgreementStatus, Role } from "@/prisma/generated/enums";
import {
  AgreementModel,
  AgreementWhereInput,
  AgreementWhereUniqueInput,
  AgreementHistoryWhereInput,
} from "@/prisma/generated/models";

export type AgreementWithOrgName = AgreementModel & {
  organization: {
    name: string;
  };
};

export const getAgreements = async (): Promise<AgreementWithOrgName[]> => {
  const { userIsGov, userOrgId, userRoles } = await getUserInfo();
  const whereClause: AgreementWhereInput = {};
  if (userIsGov && userRoles.includes(Role.DIRECTOR)) {
    whereClause.NOT = {
      status: {
        in: [AgreementStatus.DRAFT, AgreementStatus.RETURNED_TO_ANALYST],
      },
    };
  } else if (!userIsGov) {
    whereClause.organizationId = userOrgId;
    whereClause.status = AgreementStatus.ISSUED;
  }
  return await prisma.agreement.findMany({
    where: whereClause,
    include: {
      organization: {
        select: {
          name: true,
        },
      },
    },
  });
};

export const getAgreement = async (agreementId: number) => {
  const { userIsGov, userOrgId, userRoles } = await getUserInfo();
  const whereClause: AgreementWhereUniqueInput = { id: agreementId };
  if (userIsGov && userRoles.includes(Role.DIRECTOR)) {
    whereClause.status = {
      in: [AgreementStatus.RECOMMEND_APPROVAL, AgreementStatus.ISSUED],
    };
  } else if (!userIsGov) {
    whereClause.organizationId = userOrgId;
    whereClause.status = AgreementStatus.ISSUED;
  }
  return await prisma.agreement.findUnique({
    where: whereClause,
    omit: {
      aCredits: true,
      bCredits: true,
    },
    include: {
      organization: {
        select: {
          name: true,
        },
      },
      agreementContent: {
        select: {
          vehicleClass: true,
          zevClass: true,
          modelYear: true,
          numberOfUnits: true,
        },
      },
      agreementAttachment: {
        select: {
          fileName: true,
        },
      },
    },
  });
};

export const getAgreementHistories = async (agreementId: number) => {
  const { userIsGov, userOrgId } = await getUserInfo();
  const whereClause: AgreementHistoryWhereInput = { agreementId };
  if (!userIsGov) {
    whereClause.agreement = {
      organizationId: userOrgId,
    };
    whereClause.userAction = AgreementStatus.ISSUED;
  }
  return await prisma.agreementHistory.findMany({
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
