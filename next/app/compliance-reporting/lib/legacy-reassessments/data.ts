import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ReassessmentStatus, Role } from "@/prisma/generated/enums";
import { ReassessmentWhereInput } from "@/prisma/generated/models";
import { LegacyReassessment } from "./constants";

export const getLegacyReassessments = async (): Promise<
  LegacyReassessment[]
> => {
  const { userIsGov, userOrgId, userRoles } = await getUserInfo();
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
  return await prisma.reassessment.findMany({
    where: whereClause,
    select: {
      id: true,
      modelYear: true,
      status: true,
      organization: { select: { name: true } },
      ReassessmentHistory: {
        select: {
          userAction: true,
          timestamp: true,
        },
      },
    },
    orderBy: { id: "asc" },
  });
};
