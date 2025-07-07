import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma, Role, User } from "@/prisma/generated/client";
import { getOrderByClause, getWhereClause } from "./utils";

export type UserWithOrgName = User & { organization?: { name: string } };

export async function fetchUsers(
  page: number,
  pageSize: number,
  filters: Record<string, string>,
  sorts: Record<string, string>,
): Promise<{ users: UserWithOrgName[]; totalCount: number }> {
  const { userIsGov, userOrgId, userRoles } = await getUserInfo();
  if (userIsGov && !userRoles.includes(Role.ADMINISTRATOR)) {
    throw new Error("Unauthorized!");
  }
  if (!userIsGov && !userRoles.includes(Role.ORGANIZATION_ADMINISTRATOR)) {
    throw new Error("Unauthorized!");
  }
  const skip = (page - 1) * pageSize;
  const take = pageSize;
  let where = getWhereClause(filters, userIsGov);
  const orderBy = getOrderByClause(sorts, true, userIsGov);
  if (!userIsGov) {
    where = { ...where, organizationId: userOrgId };
  }
  const include: Prisma.UserInclude = {};
  if (userIsGov) {
    include["organization"] = {
      select: {
        name: true,
      },
    };
  }
  const [users, totalCount] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      orderBy,
      include,
      skip,
      take,
    }),
    prisma.user.count({ where }),
  ]);
  return { users, totalCount };
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
      where: { id, organizationId: userOrgId },
      include,
    });
  }

  return null;
}
