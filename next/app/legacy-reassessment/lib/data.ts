import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ModelYear, ReassessmentStatus, Role } from "@/prisma/generated/enums";
import { ReassessmentWhereInput } from "@/prisma/generated/models";

export type LegacyReassessment = {
  id: number;
  modelYear: ModelYear;
  status: ReassessmentStatus;
  sequenceNumber: number;
  organization?: {
    name: string;
  };
};

export const getLegacyReassessments = async (
  page: number,
  pageSize: number,
): Promise<[LegacyReassessment[], number]> => {
  const { userIsGov, userOrgId, userRoles } = await getUserInfo();
  const skip = (page - 1) * pageSize;
  const take = pageSize;
  const whereClause: ReassessmentWhereInput = {
    modelYearReportId: null,
  };
  if (userIsGov && userRoles.includes(Role.DIRECTOR)) {
    whereClause.status = {
      notIn: [ReassessmentStatus.DRAFT, ReassessmentStatus.RETURNED_TO_ANALYST],
    };
  } else if (!userIsGov) {
    whereClause.organizationId = userOrgId;
    whereClause.status = ReassessmentStatus.ISSUED;
  }
  return await prisma.$transaction([
    prisma.reassessment.findMany({
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
    prisma.reassessment.count({
      where: whereClause,
    }),
  ]);
};
