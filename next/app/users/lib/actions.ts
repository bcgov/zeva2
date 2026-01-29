"use server";

import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Idp, Role, User } from "@/prisma/generated/client";
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
import { validateRoles } from "./roleValidation";

export type UserPayload = Omit<User, "id" | "idp" | "idpSub" | "notifications">;

export const updateUser = async (
  id: number,
  data: Omit<UserPayload, "role">,
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
  await prisma.user.update({
    where: { id },
    data: {
      ...data,
      organizationId: user.organization.id,
      roles: undefined,
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
  try {
    validateRoles(roles);
  } catch (e) {
    if (e instanceof Error) {
      return getErrorActionResponse(e.message);
    }
    return getErrorActionResponse("Invalid Role detected!");
  }
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

export const updateRoles = async (
  userId: number,
  role: Role,
  addOrRemove: "add" | "remove",
): Promise<DataOrErrorActionResponse<Role[]>> => {
  const isAdmin = await userIsAdmin();
  if (!isAdmin) {
    return getErrorActionResponse("Unauthorized!");
  }
  const { userIsGov, userOrgId } = await getUserInfo();
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      organizationId: true,
      roles: true,
    },
  });
  if (!user) {
    return getErrorActionResponse("User not found!");
  }
  if (!userIsGov && user.organizationId !== userOrgId) {
    return getErrorActionResponse("Unauthorized!");
  }
  const newRoles: Role[] = [];
  if (addOrRemove === "add" && !user.roles.includes(role)) {
    newRoles.push(...user.roles, role);
  } else if (addOrRemove === "remove" && user.roles.includes(role)) {
    for (const existingRole of user.roles) {
      if (existingRole !== role) {
        newRoles.push(existingRole);
      }
    }
  } else {
    return getDataActionResponse(user.roles);
  }
  try {
    validateRoles(newRoles);
  } catch (e) {
    if (e instanceof Error) {
      return getErrorActionResponse(e.message);
    }
    return getErrorActionResponse("Invalid Role detected!");
  }
  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      roles: newRoles,
    },
  });
  return getDataActionResponse(updatedUser.roles);
};
