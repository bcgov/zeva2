"use client";

import { SecondaryNavbar } from "@/app/lib/components/SecondaryNavbar";
import { Routes } from "@/app/lib/constants";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

export const IndividualNavbar = (props: { creditApplicationId: string }) => {
  const pathname = usePathname();
  const items = useMemo(() => {
    return [
      {
        label: `Credit Application ID ${props.creditApplicationId}`,
        route: `${Routes.CreditApplications}/${props.creditApplicationId}/details`,
      },
      {
        label: "Audit History",
        route: `${Routes.CreditApplications}/${props.creditApplicationId}/audit-history`,
      },
    ];
  }, [props.creditApplicationId]);

  if (pathname.endsWith("details") || pathname.endsWith("audit-history")) {
    return <SecondaryNavbar items={items} />;
  }
  return null;
};
