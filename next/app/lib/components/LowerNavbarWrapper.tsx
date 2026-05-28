"use client";

import { JSX } from "react";
import { usePathname } from "next/navigation";
import { Routes } from "../constants";

export const LowerNavbarWrapper = (props: {
  type: "zevModel" | "zevUnitActivities";
  navbar: JSX.Element;
}) => {
  const pathname = usePathname();

  switch (props.type) {
    case "zevModel":
      if (
        pathname === Routes.ValidatedZevModels ||
        pathname === Routes.SubmittedZevModels ||
        pathname === Routes.InactiveZevModels
      ) {
        return props.navbar;
      }
      break;
    case "zevUnitActivities":
      if (
        pathname === Routes.CreditApplications ||
        pathname === Routes.CreditTransfers ||
        pathname === Routes.CreditAgreements ||
        pathname === Routes.PenaltyCredits ||
        pathname === Routes.ZevUnitTransactions
      ) {
        return props.navbar;
      }
  }
  return null;
};
