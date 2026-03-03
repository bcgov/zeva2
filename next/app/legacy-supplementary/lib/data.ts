import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SupplementaryReportStatus } from "@/prisma/generated/enums";
import { SupplementaryReportWhereInput } from "@/prisma/generated/models";
import { LegacySupplementary } from "./constants";

export const getLegacySupplementaries = async (): Promise<
  LegacySupplementary[]
> => {
  const { userIsGov, userOrgId } = await getUserInfo();
  const whereClause: SupplementaryReportWhereInput = {
    modelYearReportId: null,
  };
  if (userIsGov) {
    whereClause.status = {
      not: SupplementaryReportStatus.DRAFT,
    };
  } else {
    whereClause.organizationId = userOrgId;
  }
  return await prisma.supplementaryReport.findMany({
    where: whereClause,
    select: {
      id: true,
      modelYear: true,
      status: true,
      sequenceNumber: true,
      organization: {
        select: {
          name: true,
        },
      },
    },
    orderBy: [{ organizationId: "asc" }, { sequenceNumber: "asc" }],
  });
};
