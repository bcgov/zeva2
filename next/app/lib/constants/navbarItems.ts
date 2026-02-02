import { Role } from "@/prisma/generated/client";
import { Routes } from "./Routes";
import { govRoles, supplierRoles } from "@/app/users/lib/constants";

export type MenuItem = {
  label: string;
  route: string;
  roles?: readonly Role[];
};

export type NavbarSubItems = Record<string, MenuItem[]>;

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
      roles: [Role.ZEVA_IDIR_USER],
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
  "Compliance Reporting": [
    {
      label: "Model Year Reports",
      route: Routes.ComplianceReporting,
    },
    {
      label: "Legacy Reassessments",
      route: Routes.LegacyReassessments,
    },
  ],
};
