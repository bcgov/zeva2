import { UserWithOrg } from "@/lib/data/user";
import { Role } from "@/prisma/generated/client";

export const userConfiguredCorrectly = (user: UserWithOrg) => {
  const govRoles: Role[] = [
    Role.ADMINISTRATOR,
    Role.ENGINEER_ANALYST,
    Role.DIRECTOR,
  ];
  const supplierRoles: Role[] = [
    Role.ORGANIZATION_ADMINISTRATOR,
    Role.SIGNING_AUTHORITY,
    Role.ZEVA_USER,
  ];
  const userIsGov = user.organization.isGovernment;
  const userRoles = user.roles;
  if (userIsGov && userRoles.some((role) => supplierRoles.includes(role))) {
    return false;
  }
  if (
    userIsGov &&
    userRoles.includes(Role.ENGINEER_ANALYST) &&
    userRoles.includes(Role.DIRECTOR)
  ) {
    return false;
  }
  if (!userIsGov && userRoles.some((role) => govRoles.includes(role))) {
    return false;
  }
  return true;
};
