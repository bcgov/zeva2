import { Role } from "@/prisma/generated/client";

export const validateRoles = (roles: Role[]) => {
  const hasReadOnlyRole = roles.includes(Role.ZEVA_IDIR_USER_READ_ONLY);
  if (hasReadOnlyRole && roles.length > 1) {
    throw new Error(
      "ZEVA IDIR User (read-only) cannot be combined with other roles.",
    );
  }

  if (roles.includes(Role.ZEVA_IDIR_USER)) {
    const allowedRoles = [Role.ZEVA_IDIR_USER, Role.ADMINISTRATOR];
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
    const allowedRoles = [Role.DIRECTOR, Role.ADMINISTRATOR];
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
