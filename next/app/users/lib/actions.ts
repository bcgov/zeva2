'use server';

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/prisma/generated/client";

export const updateUser = async (
  id: number,
  organizationId: number,
  redirectTo?: string,
  updated?: {
    firstName?: string;
    lastName?: string;
    idpEmail?: string;
    idpUsername?: string;
    idpSub?: string;
    contactEmail?: string;
    isActive?: boolean;
    roles?: Role[];
  }
) => {
  const session = await auth();
  const sessionUser = session?.user;

  const hasAccess =
    sessionUser?.isGovernment ||
    sessionUser?.organizationId === organizationId;

  if (!updated || !hasAccess) return;

  await prisma.user.update({
    where: { id },
    data: {
      firstName: updated.firstName,
      lastName: updated.lastName,
      idpEmail: updated.idpEmail,
      idpUsername: updated.idpUsername,
      idpSub: updated.idpSub,
      contactEmail: updated.contactEmail,
      isActive: updated.isActive,
      roles: updated.roles,
    },
  });

  if (redirectTo) {
    redirect(redirectTo);
  }
};

export async function createUser(user: {
  firstName: string;
  lastName: string;
  contactEmail: string;
  idpEmail: string;
  idpSub?: string;
  idpUsername: string;
  isActive: boolean;
  roles: Role[];
  organizationId: number;
}) {
  const session = await auth();
  const sessionUser = session?.user;

  const isAuthorized =
    sessionUser?.isGovernment ||
    sessionUser?.organizationId === user.organizationId;

  if (!isAuthorized) throw new Error("Unauthorized");

  if (sessionUser?.isGovernment) {
    await prisma.user.create({
      data: {
        firstName: user.firstName,
        lastName: user.lastName,
        contactEmail: user.contactEmail,
        idpEmail: user.idpEmail,
        idpSub: user.idpSub,
        idpUsername: user.idpUsername,
        isActive: user.isActive,
        organizationId: user.organizationId,
        idp: "IDIR",
        roles: user.roles,
      },
    });
  }

  else {
    await prisma.user.create({
      data: {
        firstName: user.firstName,
        lastName: user.lastName,
        contactEmail: user.contactEmail,
        idpEmail: user.idpEmail,
        idpSub: user.idpSub,
        idpUsername: user.idpUsername,
        isActive: user.isActive,
        organizationId: user.organizationId,
        idp: "BCEID_BUSINESS",
        roles: user.roles,
      },
    });
  }

  redirect("/users");
}

export const deleteUser = async (id: number) => {
  const session = await auth();
  const sessionUser = session?.user;

  const allowedRoles: Role[] = [
    Role.ADMINISTRATOR,
    Role.ORGANIZATION_ADMINISTRATOR,
  ];

  const isAllowed =
    sessionUser?.isGovernment ||
    sessionUser?.roles?.some((role: Role) => allowedRoles.includes(role));

  if (isAllowed) {
    await prisma.user.delete({
      where: { id },
    });
    redirect("/users");
  } else {
    throw new Error("Unauthorized to delete users.");
  }
};
