"use client";

import React from "react";
import { Routes } from "../constants";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaAngleDown, FaAngleUp } from "react-icons/fa";
import { keycloakSignOut } from "../actions/keycloak";
import { Role } from "@/prisma/generated/client";
import { User } from "../types";
import { Row } from "./layout";

export interface INavbarOption {
  label: string;
  route: string;
  roles: Role[];
}

export interface INavbarProps {
  user: User;
}

/** Client Component used for navigation */
export const Navbar: React.FC<INavbarProps> = ({ user }) => {
  const pathname = usePathname();
  const [showUserDropDown, setShowUserDropDown] = React.useState(false);

  const navItems: INavbarOption[] = [
    { label: "Home", route: Routes.Home, roles: [] },
    {
      label: "Compliance Reporting",
      route: Routes.ComplianceReporting,
      roles: [
        Role.ZEVA_USER,
        Role.DIRECTOR,
        Role.SIGNING_AUTHORITY,
        Role.ORGANIZATION_ADMINISTRATOR,
        Role.ENGINEER_ANALYST,
      ],
    },
    {
      label: "Credit Transactions",
      route: Routes.CreditTransactions,
      roles: [
        Role.ZEVA_USER,
        Role.DIRECTOR,
        Role.SIGNING_AUTHORITY,
        Role.ORGANIZATION_ADMINISTRATOR,
        Role.ENGINEER_ANALYST,
      ],
    },
    {
      label: "ZEV Models",
      route: Routes.ZEVModels,
      roles: [Role.ZEVA_USER, Role.DIRECTOR, Role.ENGINEER_ANALYST],
    },
    {
      label: "Vehicle Suppliers",
      route: Routes.VehicleSuppliers,
      roles: [Role.ADMINISTRATOR, Role.DIRECTOR, Role.ENGINEER_ANALYST],
    },
    {
      label: "Administration",
      route: Routes.Administration,
      roles: [Role.ORGANIZATION_ADMINISTRATOR],
    },
  ];

  return (
    <Row className="w-full bg-defaultBackgroundBlue border-t-2 border-primaryYellow mr-[16rem] px-1 mb-3 text-white">
      {navItems.map((item) => {
        if (
          item.roles.some((role) => user.roles?.includes(role)) ||
          user.roles?.includes(Role.ADMINISTRATOR) ||
          !item.roles.length
        ) {
          return (
            <Link
              key={item.label}
              href={item.route}
              className={`cursor-pointer px-2 ${pathname === item.route ? "border-b-2 border-primaryYellow" : ""}`}
            >
              {item.label}
            </Link>
          );
        }
        return null;
      })}

      <div className="ml-auto relative">
        <div
          onClick={() => setShowUserDropDown(!showUserDropDown)}
          className="cursor-pointer flex flex-row items-center"
        >
          {user?.name || "User"}
          {!showUserDropDown ? (
            <FaAngleDown className="mt-[0.5px] ml-1" />
          ) : (
            <FaAngleUp className="mt-[0.5px] ml-1" />
          )}
        </div>
        {showUserDropDown && (
          <div
            onClick={keycloakSignOut}
            className="absolute right-0 bg-defaultBackgroundBlue border mt-[0.5px] p-2 shadow-lg cursor-pointer"
          >
            Sign Out
          </div>
        )}
      </div>
    </Row>
  );
};
