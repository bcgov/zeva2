import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma, Role, User } from "@/prisma/generated/client";

export type UserWithOrgName = User & { organization?: { name: string } };

export async function fetchUsers(): Promise<UserWithOrgName[]> {
  let result;
  const { userIsGov, userOrgId } = await getUserInfo();
  const orderBy: Prisma.UserOrderByWithRelationInput[] = [
    {
      id: "asc",
    },
  ];
  if (userIsGov) {
    result = await prisma.user.findMany({
      orderBy,
      include: {
        organization: {
          select: {
            name: true,
          },
        },
      },
    });
  } else {
    result = await prisma.user.findMany({
      where: {
        organizationId: userOrgId,
      },
      orderBy,
    });
  }
  return result;
}

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
      where: {
        id: id,
        organizationId: userOrgId,
      },
      include,
    });
  }
  return null;
}
