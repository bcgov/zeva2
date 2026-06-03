"use client";

import { JSX } from "react";
import { usePathname } from "next/navigation";
import { Routes } from "../constants";

export const LowerNavbarWrapper = (props: {
  type: "zevModel" | "zevUnitActivities" | "complianceReporting";
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
    case "complianceReporting":
      if (
        pathname === Routes.ComplianceCalculator ||
        pathname === Routes.ComplianceRatios ||
        pathname === Routes.LegacyReassessments ||
        pathname === Routes.LegacySupplementary ||
        pathname === Routes.ModelYearReports
      ) {
        return props.navbar;
      }
  }
  return null;
};
