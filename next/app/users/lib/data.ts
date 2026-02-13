import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Idp, Prisma, Role, User } from "@/prisma/generated/client";
import { userIsAdmin } from "./utilsServer";

export type UserWithOrgName = User & { organization: { name: string } };

export type GovUserCategory = "bceid" | "idir" | "inactive";

export type SupplierUserCategory = "active" | "inactive";

export const fetchUsers = async (
  category: GovUserCategory | SupplierUserCategory,
): Promise<UserWithOrgName[]> => {
  const isAdmin = await userIsAdmin();
  if (!isAdmin) {
    return [];
  }
  const { userIsGov, userOrgId } = await getUserInfo();
  const whereClause: Prisma.UserWhereInput = {};
  if (userIsGov) {
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
  } else {
    whereClause.organizationId = userOrgId;
    switch (category) {
      case "active":
        whereClause.isActive = true;
        break;
      case "inactive":
        whereClause.isActive = false;
        break;
    }
  }
  return await prisma.user.findMany({
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
