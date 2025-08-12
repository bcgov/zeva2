import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ModelYear, Prisma } from "@/prisma/generated/client";

export const modelYearReportExists = async (modelYear: ModelYear) => {
  const { userOrgId } = await getUserInfo();
  const report = await prisma.modelYearReport.findFirst({
    where: {
      organizationId: userOrgId,
      modelYear: modelYear,
    },
    select: {
      id: true,
    },
  });
  if (report) {
    return true;
  }
  return false;
};

export const getModelYearReport = async (id: number) => {
  const { userIsGov, userOrgId } = await getUserInfo();
  const whereClause: Prisma.ModelYearReportWhereUniqueInput = { id };
  if (!userIsGov) {
    whereClause.organizationId = userOrgId;
  }
  return await prisma.modelYearReport.findUnique({
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
