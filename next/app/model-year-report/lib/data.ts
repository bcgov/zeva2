import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ModelYear } from "@/prisma/generated/client";

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
