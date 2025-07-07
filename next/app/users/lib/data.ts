import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma, Role, User } from "@/prisma/generated/client";

export type UserWithOrgName = User & { organization?: { name: string } };

export async function fetchUsers(opts: {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  filters?: Record<string, string>;
}): Promise<{ users: UserWithOrgName[]; totalCount: number }> {
  const {
    page = 1,
    pageSize = 10,
    sortBy,
    sortOrder = "asc",
    filters = {},
  } = opts;
  const { userOrgId } = await getUserInfo();

  const where: Prisma.UserWhereInput = {
    organizationId: userOrgId,
  };

  for (const [id, value] of Object.entries(filters)) {
    if (id === "organization") {
      where.organization = {
        is: {
          name: { contains: value, mode: "insensitive" },
        },
      };
    } else {
      where[id as keyof Prisma.UserWhereInput] = {
        contains: value,
        mode: "insensitive",
      } as any;
    }
  }

  const orderBy: Prisma.UserOrderByWithRelationInput = sortBy
    ? { [sortBy]: sortOrder }
    : { id: "asc" };

  const [users, totalCount] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      orderBy,
      include: { organization: { select: { name: true } } },
      skip: (page - 1) * pageSize,
      take: pageSize,
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
    return prisma.user.findUnique({
      where: { id },
      include,
    });
  }

  if (!userIsGov && userRoles.includes(Role.ORGANIZATION_ADMINISTRATOR)) {
    return prisma.user.findUnique({
      where: { id, organizationId: userOrgId },
      include,
    });
  }

  return null;
}
