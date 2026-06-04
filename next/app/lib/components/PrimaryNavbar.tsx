"use client";

import { useMemo, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Row } from "./layout";
import Link from "next/link";
import { keycloakSignOut } from "../actions/keycloak";
import { Routes } from "../constants";
import { Role } from "@/prisma/generated/enums";

export const PrimaryNavbar = (props: {
  userIsGov: boolean;
  userRoles: Role[];
}) => {
  const pathname = usePathname();
  const [activeLabel, setActiveLabel] = useState<string>();

  const items = useMemo(() => {
    return [
      {
        label: "Home",
        route: Routes.Home,
      },
      {
        label: "Compliance Reporting",
        route: Routes.ModelYearReports,
      },
      {
        label: "Credit Transactions",
        route: Routes.CreditApplications,
      },
      {
        label: "ZEV Models",
        route: Routes.ValidatedZevModels,
      },
      ...(props.userIsGov
        ? [{ label: "Vehicle Suppliers", route: Routes.VehicleSuppliers }]
        : []),
      ...(props.userIsGov && props.userRoles.includes(Role.ADMINISTRATOR)
        ? [{ label: "Administration", route: `${Routes.Administration}/idir` }]
        : []),
      ...(!props.userIsGov &&
      props.userRoles.includes(Role.ORGANIZATION_ADMINISTRATOR)
        ? [{ label: "Administration", route: Routes.Administration }]
        : []),
    ];
  }, [props]);

  useEffect(() => {
    for (const item of items) {
      if (pathname.startsWith(item.route)) {
        setActiveLabel(item.label);
        break;
      }
    }
  }, [items, pathname]);

  return (
    <Row className="w-full items-center bg-primaryBlueHover border-t-2 border-primaryGold mr-[16rem] px-4 py-0.5 mb-3 text-white">
      <div className="flex items-center gap-6">
        {items.map((item) => (
          <Link
            key={item.label}
            className={`cursor-pointer px-3 py-0.5 border-b-2 font-semibold ${
              activeLabel === item.label
                ? "border-primaryGold"
                : "border-transparent hover:border-white/70"
            }`}
            href={item.route}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <button
        onClick={keycloakSignOut}
        className="ml-auto px-3 py-1 font-semibold hover:underline focus:outline-none bg-transparent border-0"
      >
        Log Out
      </button>
    </Row>
  );
};
