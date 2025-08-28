import { prisma } from "@/lib/prisma";

export const orgIsGovernment = async (orgId: number) => {
  const org = await prisma.organization.findUnique({
    where: {
      id: orgId,
    },
  });
  if (!org) {
    throw new Error("Organization does not exist!");
  }
  return org.isGovernment;
};
