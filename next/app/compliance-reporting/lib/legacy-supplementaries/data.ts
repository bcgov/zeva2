import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SupplementaryReportWhereInput } from "@/prisma/generated/models";
import { LegacySupplementary } from "./constants";
import { ModelYearReportStatus, Role } from "@/prisma/generated/enums";

export const getLegacySupplementaries = async (): Promise<
  LegacySupplementary[]
> => {
  const { userIsGov, userOrgId, userRoles } = await getUserInfo();
  const whereClause: SupplementaryReportWhereInput = {
    modelYearReportId: null,
  };
  if (userIsGov) {
    if (userRoles.includes(Role.DIRECTOR)) {
      whereClause.status = {
        in: [
          ModelYearReportStatus.ASSESSED,
          ModelYearReportStatus.SUBMITTED_TO_DIRECTOR,
        ],
      };
    } else if (userRoles.includes(Role.ZEVA_IDIR_USER)) {
      whereClause.status = {
        notIn: [
          ModelYearReportStatus.DRAFT,
          ModelYearReportStatus.RETURNED_TO_SUPPLIER,
        ],
      };
    }
  } else {
    whereClause.organizationId = userOrgId;
  }
  return await prisma.supplementaryReport.findMany({
    where: whereClause,
    select: {
      id: true,
      modelYear: true,
      status: true,
      organization: {
        select: {
          name: true,
        },
      },
      SupplementaryReportHistory: {
        select: {
          userAction: true,
          timestamp: true,
        },
      },
    },
    orderBy: { id: "asc" },
  });
};
