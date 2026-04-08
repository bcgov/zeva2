import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import { userIsAdmin } from "./utilsServer";
import { Role, Idp } from "@/prisma/generated/enums";
import { UserModel, UserWhereInput } from "@/prisma/generated/models";

export type UserWithOrgName = Omit<UserModel, "idpSub"> & {
  organization: { name: string };
};

export const fetchUsers = async (
  category: "bceid" | "idir" | "inactive",
): Promise<UserWithOrgName[]> => {
  const { userIsGov } = await getUserInfo();
  const isAdmin = await userIsAdmin();
  if (!userIsGov || !isAdmin) {
    return [];
  }
  const whereClause: UserWhereInput = {};
  switch (category) {
    case "bceid":
      whereClause.idp = Idp.BCEID_BUSINESS;
      whereClause.isActive = true;
      break;
    case "idir":
      whereClause.idp = Idp.AZURE_IDIR;
      whereClause.isActive = true;
      break;
    case "inactive":
      whereClause.isActive = false;
      break;
  }
  return await prisma.user.findMany({
    where: whereClause,
    omit: {
      idpSub: true,
    },
    include: {
      organization: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      id: "asc",
    },
  });
};

export async function getUser(id: number) {
  const { userIsGov, userOrgId, userRoles } = await getUserInfo();
  const include = {
    organization: {
      select: {
        name: true,
      },
    },
  };

  if (userIsGov && userRoles.includes(Role.ADMINISTRATOR)) {
    return await prisma.user.findUnique({
      where: { id },
      include,
    });
  }

  if (!userIsGov && userRoles.includes(Role.ORGANIZATION_ADMINISTRATOR)) {
    return await prisma.user.findUnique({
      where: { id, organizationId: userOrgId },
      include,
    });
  }

  return null;
}
