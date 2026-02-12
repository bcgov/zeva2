import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  AgreementStatus,
  Prisma,
  Role,
  Agreement,
} from "@/prisma/generated/client";
import { getWhereClause, getOrderByClause } from "./utilsServer";

export type AgreementWithOrgName = Agreement & {
  organization: {
    name: string;
  };
};

export const getAgreements = async (
  page: number,
  pageSize: number,
  filters: Record<string, string>,
  sorts: Record<string, string>,
): Promise<[AgreementWithOrgName[], number]> => {
  const { userIsGov, userOrgId, userRoles } = await getUserInfo();
  const skip = (page - 1) * pageSize;
  const take = pageSize;
  const orderByClause = getOrderByClause(sorts, true);
  const whereClause: Prisma.AgreementWhereInput = getWhereClause(filters);
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
  return await prisma.$transaction([
    prisma.agreement.findMany({
      skip,
      take,
      orderBy: orderByClause,
      where: whereClause,
      include: {
        organization: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.agreement.count({
      where: whereClause,
    }),
  ]);
};

export const getAgreement = async (agreementId: number) => {
  const { userIsGov, userOrgId, userRoles } = await getUserInfo();
  const whereClause: Prisma.AgreementWhereUniqueInput = { id: agreementId };
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
    include: {
      organization: {
        select: {
          name: true,
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
