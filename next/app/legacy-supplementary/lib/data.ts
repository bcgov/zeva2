import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  ModelYear,
  Prisma,
  SupplementaryReportStatus,
} from "@/prisma/generated/client";

export type LegacySupplementary = {
  id: number;
  modelYear: ModelYear;
  status: SupplementaryReportStatus;
  sequenceNumber: number;
  organization?: {
    name: string;
  };
};

export const getLegacySupplementaries = async (
  page: number,
  pageSize: number,
): Promise<[LegacySupplementary[], number]> => {
  const { userIsGov, userOrgId } = await getUserInfo();
  const skip = (page - 1) * pageSize;
  const take = pageSize;
  const whereClause: Prisma.SupplementaryReportWhereInput = {
    modelYearReportId: null,
  };
  if (userIsGov) {
    whereClause.status = {
      not: SupplementaryReportStatus.DRAFT,
    };
  } else {
    whereClause.organizationId = userOrgId;
  }
  return await prisma.$transaction([
    prisma.supplementaryReport.findMany({
      skip,
      take,
      where: whereClause,
      select: {
        id: true,
        modelYear: true,
        status: true,
        sequenceNumber: true,
        ...(userIsGov && { organization: { select: { name: true } } }),
      },
      orderBy: [{ organizationId: "asc" }, { sequenceNumber: "asc" }],
    }),
    prisma.supplementaryReport.count({
      where: whereClause,
    }),
  ]);
};
