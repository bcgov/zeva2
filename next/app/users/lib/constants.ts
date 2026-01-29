import { Role } from "@/prisma/generated/client";

export const govRoles: readonly Role[] = [
  Role.ADMINISTRATOR,
  Role.ZEVA_IDIR_USER,
  Role.ZEVA_IDIR_USER_READ_ONLY,
  Role.DIRECTOR,
];

export const supplierRoles: readonly Role[] = [
  Role.ORGANIZATION_ADMINISTRATOR,
  Role.SIGNING_AUTHORITY,
  Role.ZEVA_USER,
];
