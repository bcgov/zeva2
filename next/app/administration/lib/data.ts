import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Idp } from "@/prisma/generated/enums";
import { UserModel, UserWhereInput } from "@/prisma/generated/models";

export type UserWithOrgName = Omit<UserModel, "idpSub"> & {
  organization: { name: string };
};

export const fetchUsers = async (
  category?: "bceid" | "idir" | "inactive",
  orgId?: number,
): Promise<UserWithOrgName[]> => {
  const { userIsGov } = await getUserInfo();
  if (!userIsGov) {
    return [];
  }
  if ((!category && !orgId) || (category && orgId)) {
    throw new Error("Invalid function call!");
  }
  const whereClause: UserWhereInput = {};
  if (category) {
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
  } else if (orgId) {
    whereClause.organizationId = orgId;
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
  const { userIsGov, userOrgId } = await getUserInfo();
  const include = {
    organization: {
      select: {
        name: true,
      },
    },
  };

  if (userIsGov) {
    return await prisma.user.findUnique({
      where: { id },
      include,
    });
  }
  return await prisma.user.findUnique({
    where: { id, organizationId: userOrgId },
    include,
  });
}
