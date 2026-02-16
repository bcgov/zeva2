import { Role } from "@/prisma/generated/enums";
import { govRoles, supplierRoles } from "./constants";

export const validateRoles = (roles: Role[], rolesAreForGovUser: boolean) => {
  const rolesSet = new Set<Role>(roles);
  if (rolesSet.size !== roles.length) {
    throw new Error("Duplicate roles detected!");
  }
  if (
    rolesAreForGovUser &&
    roles.some((role) => supplierRoles.includes(role))
  ) {
    throw new Error("Invalid Role detected!");
  }
  if (!rolesAreForGovUser && roles.some((role) => govRoles.includes(role))) {
    throw new Error("Invalid Role detected!");
  }

  const hasReadOnlyRole = roles.includes(Role.ZEVA_IDIR_USER_READ_ONLY);
  if (hasReadOnlyRole && roles.length > 1) {
    throw new Error(
      "ZEVA IDIR User (read-only) cannot be combined with other roles.",
    );
  }

  if (roles.includes(Role.ZEVA_IDIR_USER)) {
    const allowedRoles: Role[] = [Role.ZEVA_IDIR_USER, Role.ADMINISTRATOR];
    const incompatibleRoles = roles.filter(
      (role) => !allowedRoles.includes(role),
    );
    if (incompatibleRoles.length > 0) {
      throw new Error(
        "ZEVA IDIR User can only be combined with the Administrator role.",
      );
    }
  }

  if (roles.includes(Role.DIRECTOR)) {
    const allowedRoles: Role[] = [Role.DIRECTOR, Role.ADMINISTRATOR];
    const incompatibleRoles = roles.filter(
      (role) => !allowedRoles.includes(role),
    );
    if (incompatibleRoles.length > 0) {
      throw new Error(
        "Director role can only be combined with the Administrator role.",
      );
    }
  }
};
