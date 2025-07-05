import { getStringsToIdpEnumsMap } from "@/app/lib/utils/enumMaps";
import { prisma } from "@/lib/prisma";
import { Idp, Organization, User } from "@/prisma/generated/client";
import { Profile } from "next-auth";

export type UserWithOrg = User & { organization: Organization };

export const getActiveUser = async (
  profile: Profile | undefined,
): Promise<UserWithOrg | null> => {
  if (!profile) {
    return null;
  }
  const idp = profile.identity_provider;
  const idpSub = profile.sub;
  if (!idp || !idpSub) {
    return null;
  }
  const user = await findUniqueMappedActiveUser(idpSub);
  if (user) {
    return user;
  }
  const idpMap = getStringsToIdpEnumsMap();
  const idpEnum = idpMap[idp];
  if (!idpEnum) {
    return null;
  }
  let idpUsername: string | undefined;
  if (idpEnum === Idp.BCEID_BUSINESS) {
    idpUsername = profile.bceid_username;
  } else if (idpEnum === Idp.AZURE_IDIR) {
    idpUsername = profile.idir_username;
  }
  if (!idpUsername) {
    return null;
  }
  return await findUniqueUnmappedActiveUser(idpEnum, idpUsername, idpSub);
};

export const findUniqueMappedActiveUser = async (idpSub: string) => {
  const users = await prisma.user.findMany({
    where: {
      idpSub: idpSub,
      isActive: true,
    },
    include: {
      organization: true,
    },
  });
  if (users.length === 0 || users.length > 1) {
    return null;
  }
  return users[0];
};

export const findUniqueUnmappedActiveUser = async (
  idp: Idp,
  idpUsername: string,
  idpSub: string,
) => {
  const users = await prisma.user.findMany({
    where: {
      idp: idp,
      idpUsername: idpUsername,
      idpSub: null,
      isActive: true,
    },
    include: {
      organization: true,
    },
  });
  if (users.length === 0 || users.length > 1) {
    return null;
  }
  const user = users[0];
  await mapUser(user.id, idpSub);
  return user;
};

export const mapUser = async (id: number, idpSub: string | null) => {
  await prisma.user.update({
    where: {
      id: id,
    },
    data: {
      idpSub: idpSub,
    },
  });
};

export const resetFlag = async (id: number) => {
  await prisma.user.update({
    where: {
      id: id,
    },
    data: {
      wasUpdated: false,
    },
  });
};

export const wasUserUpdated = async (id: number) => {
  const user = await prisma.user.findUnique({
    where: {
      id,
      wasUpdated: true,
    },
    select: {
      id: true,
    },
  });
  if (user) {
    return true;
  }
  return false;
};
