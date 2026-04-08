import { Role } from "@/prisma/generated/enums";
import { UserPayload } from "./actions";
import { validateRoles } from "./utils";

export const getUserPayload = (
  data: Partial<Record<string, string>>,
  roles: Role[],
  rolesAreForGovUser: boolean,
): UserPayload => {
  if (
    !data.organizationId ||
    !data.firstName ||
    !data.lastName ||
    !data.contactEmail ||
    !data.idpUsername ||
    !data.isActive
  ) {
    throw new Error("All fields are required!");
  }
  const orgId = parseInt(data.organizationId, 10);
  if (Number.isNaN(orgId)) {
    throw new Error("Org ID is not a number!");
  }
  validateRoles(roles, rolesAreForGovUser);
  return {
    organizationId: orgId,
    firstName: data.firstName,
    lastName: data.lastName,
    contactEmail: data.contactEmail,
    idpUsername: data.idpUsername,
    isActive: data.isActive === "true",
    roles,
  };
};
