import { Role } from "@/prisma/generated/client";
import { Routes } from "./Routes";

export type MenuItem = {
  label: string;
  route: string;
  roles?: Role[];
};

export type NavbarSubItems = Record<string, MenuItem[]>;

const govRoles = [Role.ADMINISTRATOR, Role.ENGINEER_ANALYST, Role.DIRECTOR];

const supplierRoles = [
  Role.ORGANIZATION_ADMINISTRATOR,
  Role.SIGNING_AUTHORITY,
  Role.ZEVA_USER,
];

export const navbarMainItems: MenuItem[] = [
  {
    label: "Home",
    route: Routes.Home,
  },
  {
    label: "Compliance Reporting",
    route: Routes.ComplianceReporting,
  },
  {
    label: "Credit Transactions",
    route: Routes.CreditApplication,
    roles: govRoles,
  },
  {
    label: "Credit Transactions",
    route: Routes.ZevUnitBalance,
    roles: supplierRoles,
  },
  {
    label: "ZEV Models",
    route: Routes.Vehicle,
  },
  {
    label: "Vehicle Suppliers",
    route: Routes.VehicleSuppliers,
    roles: govRoles,
  },
  {
    label: "Administration",
    route: Routes.Administration,
    roles: [Role.ORGANIZATION_ADMINISTRATOR],
  },
  {
    label: "Administration",
    route: Routes.Users,
    roles: [Role.ADMINISTRATOR],
  },
];

export const navbarSubItems: NavbarSubItems = {
  "Credit Transactions": [
    {
      label: "Credit Applications",
      route: Routes.CreditApplication,
    },
    {
      label: "Credit Balance",
      route: Routes.ZevUnitBalance,
      roles: supplierRoles,
    },
    {
      label: "Credit Transfers",
      route: Routes.CreditTransfers,
    },
    {
      label: "Credit Agreements",
      route: Routes.CreditAgreements,
      roles: govRoles,
    },
    {
      label: "Penalty Credits",
      route: Routes.PenaltyCredit,
      roles: govRoles,
    },
    {
      label: "Update ICBC Data",
      route: Routes.Icbc,
      roles: [Role.ENGINEER_ANALYST],
    },
  ],
  "Vehicle Suppliers": [
    {
      label: "Supplier Info",
      route: `${Routes.VehicleSuppliers}/:id`,
      roles: govRoles,
    },
    {
      label: "Credit Transactions",
      route: `${Routes.ZevUnitBalance}/:id`,
      roles: govRoles,
    },
  ],
};
