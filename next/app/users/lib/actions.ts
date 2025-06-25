"use server";

import { redirect } from "next/navigation";
import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Idp, Role, User } from "@/prisma/generated/client";

export type UserUpdatePayload = Omit<
  User,
  "id" | "organizationId" | "idp" | "notifications"
>;

export const updateUser = async (
  id: number,
  organizationId: number,
  updated?: UserUpdatePayload,
) => {
  const { userIsGov, userOrgId } = await getUserInfo();
  const hasAccess = userIsGov || userOrgId === organizationId;
  if (!updated || !hasAccess) return;

  await prisma.user.update({
    where: { id },
    data: updated,
  });
};

export type UserCreatePayload = UserUpdatePayload & { organizationId: number };

export async function createUser(user: UserCreatePayload) {
  const { userIsGov, userOrgId } = await getUserInfo();
  const isAuthorized = userIsGov || userOrgId === user.organizationId;
  if (!isAuthorized) throw new Error("Unauthorized");

  if (userIsGov) {
    await prisma.user.create({
      data: { ...user, idp: Idp.IDIR },
    });
  } else {
    await prisma.user.create({
      data: { ...user, idp: Idp.BCEID_BUSINESS },
    });
  }
  redirect("/users");
}

export const deleteUser = async (id: number) => {
  const { userIsGov, userRoles } = await getUserInfo();

  const allowedRoles: Role[] = [
    Role.ADMINISTRATOR,
    Role.ORGANIZATION_ADMINISTRATOR,
  ];
  const isAllowed =
    userIsGov || userRoles.some((role: Role) => allowedRoles.includes(role));

  if (isAllowed) {
    await prisma.user.delete({
      where: { id },
    });
    redirect("/users");
  } else {
    throw new Error("Unauthorized to delete users.");
  }
};
