import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/prisma/generated/client";

export async function fetchUsers() {
  let result;
  const session = await auth();
  const isGov = session?.user?.isGovernment;
  const organizationId = session?.user?.organizationId;
  if (isGov) {
    result = await prisma.user.findMany({
      orderBy: [
        {
          id: "asc",
        },
      ],
    });
  } else {
    result = await prisma.user.findMany({
      where: {
        organizationId: organizationId,
      },
      orderBy: [
        {
          id: "asc",
        },
      ],
    });
  }
  return result;
}

export async function getUser(id: number) {
  const session = await auth();
  const isGov = session?.user?.isGovernment;
  const roles = session?.user?.roles;
  const organizationId = session?.user?.organizationId;
  const organization = {
    organization: {
      select: {
        name: true,
      },
    },
  };
  if (isGov && roles?.includes(Role.ADMINISTRATOR)) {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            name: true,
          },
        },
      },
    });
  }
  if (!isGov && roles?.includes(Role.ORGANIZATION_ADMINISTRATOR)) {
    return await prisma.user.findUnique({
      where: { 
        id: id,
        organizationId: organizationId
       },
      include: {
        organization: {
          select: {
            name: true,
          },
        },
      },
    });
  }
  return null;
}
