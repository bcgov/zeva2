"use client";

import { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { SecondaryNavbar } from "@/app/lib/components/SecondaryNavbar";
import { Routes } from "@/app/lib/constants";
import { allRecordsViewParam } from "../lib/constants";

export const AllRecordsTabsGov = (props: { isDirector: boolean }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentView = searchParams.get(allRecordsViewParam);

  const tabDefs = useMemo(() => {
    return [
      { label: "All Records", view: "all" },
      { label: "Requires Your Action", view: "requires-your-action" },
      ...(!props.isDirector
        ? [{ label: "In Progress", view: "in-progress" }]
        : []),
      ...(!props.isDirector
        ? [{ label: "With Director", view: "with-director" }]
        : []),
      { label: "Completed", view: "completed" },
    ];
  }, [props.isDirector]);

  const items = useMemo(() => {
    return [
      ...tabDefs.map((tab) => ({
        label: tab.label,
        route: `${Routes.Home}/all-records-gov?${allRecordsViewParam}=${tab.view}`,
      })),
      { label: "Activity Feed", route: `${Routes.Home}/activity-feed` },
    ];
  }, [tabDefs]);

  const activeIndex = useMemo(() => {
    if (pathname.startsWith(`${Routes.Home}/activity-feed`)) {
      return items.length - 1;
    }
    const index = tabDefs.findIndex((tab) => tab.view === currentView);
    return index;
  }, [pathname, currentView, items.length, tabDefs]);

  return <SecondaryNavbar items={items} activeIndex={activeIndex} />;
};
