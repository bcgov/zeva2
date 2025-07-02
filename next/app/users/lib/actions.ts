"use server";

import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Idp, User } from "@/prisma/generated/client";

export type UserPayload = Omit<
  User,
  "id" | "idp" | "idpSub" | "notifications" | "wasUpdated"
>;

export const updateUser = async (id: number, data: UserPayload) => {
  const { userIsGov, userOrgId } = await getUserInfo();
  const user = await prisma.user.findUnique({
    where: {
      id,
    },
  });
  if (!user) {
    throw new Error("No such user!");
  }
  if (!userIsGov && userOrgId !== user.organizationId) {
    throw new Error("Unauthorized!");
  }
  await prisma.user.update({
    where: { id },
    data: { ...data, organizationId: user.organizationId, wasUpdated: true },
  });
};

export async function createUser(user: UserPayload) {
  const { userIsGov, userOrgId } = await getUserInfo();
  if (!userIsGov && userOrgId !== user.organizationId) {
    throw new Error("Unauthorized");
  }
  const overridingData: { idp: Idp; organizationId?: number } = {
    idp: Idp.IDIR,
  };
  if (!userIsGov) {
    overridingData.idp = Idp.BCEID_BUSINESS;
    overridingData.organizationId = userOrgId;
  }
  const createdUser = await prisma.user.create({
    data: { ...user, ...overridingData, idpSub: null },
  });
  return createdUser.id;
}
