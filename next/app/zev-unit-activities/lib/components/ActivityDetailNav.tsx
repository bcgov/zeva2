"use client";

import { Breadcrumbs } from "@/app/lib/components";
import { SecondaryNavbar } from "@/app/lib/components/SecondaryNavbar";
import { Routes } from "@/app/lib/constants";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

const activityTabs: Record<
  string,
  {
    label: string;
    route: Routes;
    objectLabel: (id: string) => string;
  }
> = {
  "credit-agreements": {
    label: "Credit Agreements",
    route: Routes.CreditAgreements,
    objectLabel: (id) => `Credit Agreement ID ${id}`,
  },
  "credit-applications": {
    label: "Credit Applications",
    route: Routes.CreditApplications,
    objectLabel: (id) => `Credit Application ID ${id}`,
  },
  "credit-transfers": {
    label: "Credit Transfers",
    route: Routes.CreditTransfers,
    objectLabel: (id) => `Credit Transfer ID ${id}`,
  },
  "penalty-credits": {
    label: "Penalty Credits",
    route: Routes.PenaltyCredits,
    objectLabel: (id) => `Penalty Credit ID ${id}`,
  },
};

const segmentLabels: Record<string, string> = {
  edit: "Edit",
  "model-name-mismatches": "Model Name Mismatches",
  validated: "Validated Records",
};

export const ActivityDetailNav = (props: { slug: string; id: string }) => {
  const pathname = usePathname();
  const tab = activityTabs[props.slug];

  const secondaryNavItems = useMemo(() => {
    if (props.slug !== "credit-applications") {
      return [];
    }

    return [
      {
        label: `Credit Application ID ${props.id}`,
        route: `${Routes.CreditApplications}/${props.id}/details`,
      },
      {
        label: "Audit History",
        route: `${Routes.CreditApplications}/${props.id}/audit-history`,
      },
    ];
  }, [props.slug, props.id]);

  if (!tab) {
    return null;
  }

  const basePath = `/zev-unit-activities/${props.slug}/${props.id}`;
  const segments = pathname
    .replace(basePath, "")
    .split("/")
    .filter((segment) => segment !== "");
  const currentSegment = segments.at(-1);
  const objectLabel = tab.objectLabel(props.id);
  const objectHref = `${tab.route}/${props.id}`;
  const currentLabel = currentSegment ? segmentLabels[currentSegment] : "";

  const breadcrumbItems = [
    { label: "ZEV Unit Activities", href: Routes.CreditApplications },
    { label: tab.label, href: tab.route },
    ...(currentLabel
      ? [
          { label: objectLabel, href: objectHref },
          { label: currentLabel },
        ]
      : [{ label: objectLabel }]),
  ];

  const showSecondaryNav =
    props.slug === "credit-applications" &&
    (pathname.endsWith("details") || pathname.endsWith("audit-history"));

  return (
    <>
      <Breadcrumbs items={breadcrumbItems} />
      {showSecondaryNav && <SecondaryNavbar items={secondaryNavItems} />}
    </>
  );
};
