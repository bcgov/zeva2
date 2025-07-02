import { prisma } from "@/lib/prisma";

export const getOrgsMap = async (
  orgIdToExclude: number | null,
  excludeGovOrg: boolean,
) => {
  const result: { [key: number]: string } = {};
  const where: { isGovernment?: false; id?: { not: number } } = {};
  if (excludeGovOrg) {
    where.isGovernment = false;
  }
  if (orgIdToExclude !== null) {
    where.id = { not: orgIdToExclude };
  }
  const orgs = await prisma.organization.findMany({
    where: where,
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });
  for (const org of orgs) {
    result[org.id] = org.name;
  }
  return result;
};
