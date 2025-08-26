"use server";

import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Idp, User } from "@/prisma/generated/client";
import { userIsAdmin } from "./utils";
import {
  DataOrErrorActionResponse,
  ErrorOrSuccessActionResponse,
  getDataActionResponse,
  getErrorActionResponse,
  getSuccessActionResponse,
} from "@/app/lib/utils/actionResponse";

export type UserPayload = Omit<User, "id" | "idp" | "idpSub" | "wasUpdated">;

export const updateUser = async (
  id: number,
  data: UserPayload,
): Promise<ErrorOrSuccessActionResponse> => {
  const isAdmin = await userIsAdmin();
  if (!isAdmin) {
    return getErrorActionResponse("Unauthorized!");
  }
  const { userIsGov, userOrgId } = await getUserInfo();
  const user = await prisma.user.findUnique({
    where: {
      id,
    },
  });
  if (!user) {
    return getErrorActionResponse("No such user!");
  }
  if (!userIsGov && userOrgId !== user.organizationId) {
    return getErrorActionResponse("Unauthorized!");
  }
  await prisma.user.update({
    where: { id },
    data: { ...data, organizationId: user.organizationId, wasUpdated: true },
  });
  return getSuccessActionResponse();
};

export async function createUser(
  user: UserPayload,
): Promise<DataOrErrorActionResponse<number>> {
  const isAdmin = await userIsAdmin();
  if (!isAdmin) {
    return getErrorActionResponse("Unauthorized!");
  }
  const { userIsGov, userOrgId } = await getUserInfo();
  if (!userIsGov && userOrgId !== user.organizationId) {
    return getErrorActionResponse("Unauthorized!");
  }
  const overridingData: { idp: Idp; organizationId?: number } = {
    idp: Idp.AZURE_IDIR,
  };
  if (!userIsGov) {
    overridingData.idp = Idp.BCEID_BUSINESS;
    overridingData.organizationId = userOrgId;
  }
  const createdUser = await prisma.user.create({
    data: { ...user, ...overridingData, idpSub: null },
  });
  return getDataActionResponse<number>(createdUser.id);
}
