import { getUserInfo } from "@/auth";
import { UserWithOrg } from "@/lib/data/user";
import { Role } from "@/prisma/generated/enums";
import { validateRoles } from "./utils";

export const userConfiguredCorrectly = (user: UserWithOrg) => {
  const userIsGov = user.organization.isGovernment;
  const userRoles = user.roles;
  try {
    validateRoles(userRoles, userIsGov);
  } catch {
    return false;
  }
  return true;
};

export const userIsAdmin = async () => {
  const { userIsGov, userRoles } = await getUserInfo();
  if (userIsGov && userRoles.includes(Role.ADMINISTRATOR)) {
    return true;
  }
  if (!userIsGov && userRoles.includes(Role.ORGANIZATION_ADMINISTRATOR)) {
    return true;
  }
  return false;
};
