import { getStringsToRoleEnumsMap } from "@/app/lib/utils/enumMaps";
import { prismaOld } from "@/lib/prismaOld";
import { TransactionClient } from "@/types/prisma";
import { Idp, Role } from "../generated/client";
import { validateRoles } from "@/app/users/lib/roleValidation";

export const seedUsers = async (
  tx: TransactionClient,
  mapOfOldOrgIdsToNewOrgIds: Partial<Record<number, number>>,
) => {
  const mapOfOldUserIdsToNewUserIds: Partial<Record<number, number>> = {};
  const usersOld = await prismaOld.user_profile.findMany({
    include: {
      organization: true,
    },
  });
  const rolesMap = getStringsToRoleEnumsMap();
  const legacyRoleMap: Partial<Record<string, Role>> = {
    "Engineer/Analyst": Role.ZEVA_IDIR_USER,
  };
  for (const userOld of usersOld) {
    if (!userOld.organization_id || !userOld.organization) {
      throw new Error("user " + userOld.id + " with no org id!");
    }
    const orgIdNew = mapOfOldOrgIdsToNewOrgIds[userOld.organization_id];
    if (!orgIdNew) {
      throw new Error("user " + userOld.id + " with unknown org id!");
    }
    const userIsGov = userOld.organization.is_government;
    let idpSub = userOld.keycloak_user_id;
    if (userIsGov && idpSub) {
      idpSub = idpSub.split("@")[0] + "@azureidir";
    }
    const userRolesOld = await prismaOld.user_role.findMany({
      where: {
        user_profile_id: userOld.id,
      },
      include: {
        role: true,
      },
    });
    let roles: Role[] = [];
    userRolesOld.forEach((userRole) => {
      const role = userRole.role;
      if (
        (userIsGov && role.is_government_role) ||
        (!userIsGov && !role.is_government_role)
      ) {
        let roleEnum = rolesMap[role.role_code] ?? legacyRoleMap[role.role_code];
        if (!roleEnum && role.role_code === "ZEVA User") {
          roleEnum = Role.ZEVA_USER;
        }
        if (!roleEnum) {
          throw new Error("Encountered unknown role " + role.role_code + "!");
        }
        if (!roles.includes(roleEnum)) {
          roles.push(roleEnum);
        }
      }
    });
    if (
      roles.includes(Role.ZEVA_IDIR_USER) &&
      roles.includes(Role.DIRECTOR)
    ) {
      roles = roles.filter((role) => role !== Role.DIRECTOR);
    }
    if (userIsGov) {
      validateRoles(roles);
    }
    const userNew = await tx.user.create({
      data: {
        contactEmail: userOld.email,
        idpSub,
        idp: userOld.organization?.is_government
          ? Idp.AZURE_IDIR
          : Idp.BCEID_BUSINESS,
        idpUsername: userOld.username,
        isActive: userOld.is_active,
        organizationId: orgIdNew,
        firstName: userOld.first_name ?? "",
        lastName: userOld.last_name ?? "",
        roles,
        notifications: [],
      },
    });
    mapOfOldUserIdsToNewUserIds[userOld.id] = userNew.id;
  }
  return mapOfOldUserIdsToNewUserIds;
};
