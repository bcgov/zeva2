"use client";

import { SecondaryNavbar } from "@/app/lib/components/SecondaryNavbar";
import { Routes } from "@/app/lib/constants";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

export const CreditTransferNavbar = (props: { creditTransferId: string }) => {
  const pathname = usePathname();
  const items = useMemo(() => {
    return [
      {
        label: `Credit Transfer ID ${props.creditTransferId}`,
        route: `${Routes.CreditTransfers}/${props.creditTransferId}/details`,
      },
      {
        label: "Audit History",
        route: `${Routes.CreditTransfers}/${props.creditTransferId}/audit-history`,
      },
    ];
  }, [props.creditTransferId]);

  if (pathname.endsWith("details") || pathname.endsWith("audit-history")) {
    return <SecondaryNavbar items={items} />;
  }
  return null;
};
