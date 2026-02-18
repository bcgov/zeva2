import { GovUserCategory, SupplierUserCategory } from "./data";
import { Role } from "@/prisma/generated/enums";

export const govRoles: readonly Role[] = [
  Role.ADMINISTRATOR,
  Role.ZEVA_IDIR_USER,
  Role.ZEVA_IDIR_USER_READ_ONLY,
  Role.DIRECTOR,
];

export const supplierRoles: readonly Role[] = [
  Role.ORGANIZATION_ADMINISTRATOR,
  Role.SIGNING_AUTHORITY,
  Role.ZEVA_BCEID_USER,
];

export const categoriesToTabsMap: Readonly<
  Record<GovUserCategory | SupplierUserCategory, string>
> = {
  active: "Active",
  bceid: "BCeID",
  idir: "IDIR",
  inactive: "Inactive",
};
