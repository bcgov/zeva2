import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  AgreementType,
  AgreementStatus,
  ZevClass,
} from "@/prisma/generated/client";
import { Decimal } from "@/prisma/generated/client/runtime/index-browser";
import { getWhereClause, getOrderByClause } from "./utils";

export type AgreementSparse = {
  id: number;
  referenceId: string | null;
  organization: {
    shortName: string;
  };
  agreementType: AgreementType;
  status: AgreementStatus;
  effectiveDate: Date | null;
  creditA: number;
  creditB: number;
};

// page is 1-based
export const getAgreements = async (
  page: number,
  pageSize: number,
  filters: { [key: string]: string },
  sorts: { [key: string]: string },
): Promise<[AgreementSparse[], number]> => {
  const { userIsGov } = await getUserInfo();
  if (!userIsGov) {
    return [[], 0];
  }

  const where = getWhereClause(filters);
  const orderBy = getOrderByClause(sorts, true);
  const [agreementsRaw, numberOfAgreements] = await prisma.$transaction([
    prisma.agreement.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      where,
      select: {
        id: true,
        referenceId: true,
        organization: {
          select: { shortName: true },
        },
        agreementType: true,
        status: true,
        effectiveDate: true,
        agreementContent: {
          select: {
            zevClass: true,
            numberOfUnits: true,
          },
        },
      },
      orderBy,
    }),
    prisma.agreement.count({ where }),
  ]);

  const agreements: AgreementSparse[] = agreementsRaw.map((agreementRaw) => {
    const { agreementContent, ...agreement } = agreementRaw;
    return {
      ...agreement,
      creditA: agreementContent
        .filter((content) => content.zevClass === ZevClass.A)
        .reduce(
          (acc, content) => acc.add(new Decimal(content.numberOfUnits)),
          new Decimal(0),
        )
        .toNumber(),
      creditB: agreementContent
        .filter((content) => content.zevClass === ZevClass.B)
        .reduce(
          (acc, content) => acc.add(new Decimal(content.numberOfUnits)),
          new Decimal(0),
        )
        .toNumber(),
    };
  });

  return [agreements, numberOfAgreements];
};
