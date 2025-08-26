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
import { govRoles, supplierRoles } from "./constants";
import { orgIsGovernment } from "./services";

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
    select: {
      organization: {
        select: {
          id: true,
          isGovernment: true,
        },
      },
    },
  });
  if (!user) {
    return getErrorActionResponse("No such user!");
  }
  if (!userIsGov && userOrgId !== user.organization.id) {
    return getErrorActionResponse("Unauthorized!");
  }
  const userOrgIsGov = user.organization.isGovernment;
  const roles = data.roles;
  if (
    (!userOrgIsGov && roles.some((role) => govRoles.includes(role))) ||
    (userOrgIsGov && roles.some((role) => supplierRoles.includes(role)))
  ) {
    return getErrorActionResponse("Invalid Role detected!");
  }
  await prisma.user.update({
    where: { id },
    data: {
      ...data,
      organizationId: user.organization.id,
      wasUpdated: true,
    },
  });
  return getSuccessActionResponse();
};

export async function createUser(
  data: UserPayload,
): Promise<DataOrErrorActionResponse<number>> {
  const isAdmin = await userIsAdmin();
  if (!isAdmin) {
    return getErrorActionResponse("Unauthorized!");
  }
  const { userIsGov, userOrgId } = await getUserInfo();
  const dataOrgId = data.organizationId;
  if (!userIsGov && userOrgId !== dataOrgId) {
    return getErrorActionResponse("Unauthorized!");
  }
  const orgIsGov = await orgIsGovernment(dataOrgId);
  const roles = data.roles;
  if (
    (!orgIsGov && roles.some((role) => govRoles.includes(role))) ||
    (orgIsGov && roles.some((role) => supplierRoles.includes(role)))
  ) {
    return getErrorActionResponse("Invalid Role detected!");
  }
  let idp: Idp = Idp.BCEID_BUSINESS;
  if (orgIsGov) {
    idp = Idp.AZURE_IDIR;
  }
  const createdUser = await prisma.user.create({
    data: { ...data, idp, idpSub: null },
  });
  return getDataActionResponse<number>(createdUser.id);
}
