import { UserActiveFilter } from "@/app/lib/constants/filter";
import { getStringsToRoleEnumsMap } from "@/app/lib/utils/enumMaps";
import { getUserInfo } from "@/auth";
import { UserWithOrg } from "@/lib/data/user";
import { Prisma, Role } from "@/prisma/generated/client";
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

export const getWhereClause = (
  filters: Record<string, string>,
  userIsGov: boolean,
): Prisma.UserWhereInput => {
  const result: Prisma.UserWhereInput = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (
      key === "firstName" ||
      key === "lastName" ||
      key === "contactEmail" ||
      key === "idpUsername"
    ) {
      const newValue = value.trim();
      result[key] = {
        contains: newValue,
        mode: "insensitive",
      };
    } else if (key === UserActiveFilter.key) {
      const newValue = value.toLowerCase().trim();
      if (newValue === UserActiveFilter.activeValue) {
        result[key] = true;
      } else if (newValue === UserActiveFilter.inactiveValue) {
        result[key] = false;
      } else {
        result["id"] = -1;
      }
    } else if (key === "organization" && userIsGov) {
      const newValue = value.trim();
      result[key] = {
        is: {
          name: {
            contains: newValue,
            mode: "insensitive",
          },
        },
      };
    } else if (key === "roles") {
      const rolesMap = getStringsToRoleEnumsMap();
      const newValue = value.replaceAll(" ", "").toLowerCase();
      const matches: Role[] = [];
      Object.entries(rolesMap).forEach(([role, roleEnum]) => {
        const roleTransformed = role.replaceAll("_", "").toLowerCase();
        if (roleEnum && roleTransformed.includes(newValue)) {
          matches.push(roleEnum);
        }
      });
      result[key] = {
        hasSome: matches,
      };
    }
  });
  return result;
};

export const getOrderByClause = (
  sorts: Record<string, string>,
  defaultSortById: boolean,
  userIsGov: boolean,
): Prisma.UserOrderByWithRelationInput[] => {
  const result: Prisma.UserOrderByWithRelationInput[] = [];
  Object.entries(sorts).forEach(([key, value]) => {
    if (value === "asc" || value === "desc") {
      if (
        key === "firstName" ||
        key === "lastName" ||
        key === "contactEmail" ||
        key === "idpUsername"
      ) {
        result.push({ [key]: value });
      } else if (key === "organization" && userIsGov) {
        result.push({
          [key]: {
            name: value,
          },
        });
      }
    }
  });
  if (defaultSortById && result.length === 0) {
    result.push({ id: "desc" });
  }
  return result;
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
