import { Role } from "@/prisma/generated/client";

export const govRoles: readonly Role[] = [
  Role.ADMINISTRATOR,
  Role.ENGINEER_ANALYST,
  Role.DIRECTOR,
];

export const supplierRoles: readonly Role[] = [
  Role.ORGANIZATION_ADMINISTRATOR,
  Role.SIGNING_AUTHORITY,
  Role.ZEVA_USER,
];
