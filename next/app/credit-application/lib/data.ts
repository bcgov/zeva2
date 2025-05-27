import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/prisma/generated/client";

export const getCreditApplication = async (creditApplicationId: number) => {
  const { userIsGov, userOrgId } = await getUserInfo();
  let whereClause: Prisma.CreditApplicationWhereUniqueInput = {
    id: creditApplicationId,
  };
  if (!userIsGov) {
    whereClause = { ...whereClause, organizationId: userOrgId };
  }
  return await prisma.creditApplication.findUnique({
    where: whereClause,
  });
};
