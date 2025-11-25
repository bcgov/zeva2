import { Notification, Role } from "@/prisma/generated/client";
import { UserPayload } from "./actions";

export const getUserPayload = (
  data: Partial<Record<string, string>>,
  roles: Role[],
  notifications: Notification[],
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
  validateRoles(roles);
  return {
    organizationId: orgId,
    firstName: data.firstName,
    lastName: data.lastName,
    contactEmail: data.contactEmail,
    idpUsername: data.idpUsername,
    isActive: data.isActive === "true",
    roles,
    notifications,
  };
};

export const validateRoles = (roles: Role[]) => {
  if (roles.includes(Role.DIRECTOR) && roles.includes(Role.ENGINEER_ANALYST)) {
    throw new Error(
      "A user cannot have both the Director and Engineer/Analyst roles!",
    );
  }
};
