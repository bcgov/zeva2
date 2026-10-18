"use client";

import { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { SecondaryNavbar } from "@/app/lib/components/SecondaryNavbar";
import { Routes } from "@/app/lib/constants";
import { AllRecordsView, allRecordsViewParam } from "../lib/constants";

const tabDefs: { label: string; view?: AllRecordsView }[] = [
  { label: "All Records" },
  { label: "Requires Your Action", view: AllRecordsView.RequiresYourAction },
  { label: "In Progress", view: AllRecordsView.InProgress },
  { label: "With Director", view: AllRecordsView.WithDirector },
  { label: "Completed", view: AllRecordsView.Completed },
];

export const AllRecordsTabs = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentView = searchParams.get(allRecordsViewParam) ?? undefined;

  const items = useMemo(
    () => [
      ...tabDefs.map((tab) => ({
        label: tab.label,
        route: tab.view
          ? `${Routes.Home}/all-records?${allRecordsViewParam}=${tab.view}`
          : `${Routes.Home}/all-records`,
      })),
      { label: "Activity Feed", route: `${Routes.Home}/activity-feed` },
    ],
    [],
  );

  const activeIndex = useMemo(() => {
    if (pathname.startsWith(`${Routes.Home}/activity-feed`)) {
      return items.length - 1;
    }
    const index = tabDefs.findIndex((tab) => tab.view === currentView);
    return index === -1 ? 0 : index;
  }, [pathname, currentView, items.length]);

  return <SecondaryNavbar items={items} activeIndex={activeIndex} />;
};
