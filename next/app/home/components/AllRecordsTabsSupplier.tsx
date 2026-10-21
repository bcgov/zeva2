"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { SecondaryNavbar } from "@/app/lib/components/SecondaryNavbar";
import { allRecordsViewParam, supplierViewsData } from "../lib/constants";
import { getAllRecordsViewRouteSupplier } from "../lib/utils";

export const AllRecordsTabsSupplier = () => {
  const currentView = useSearchParams().get(allRecordsViewParam);

  const tabs = useMemo(
    () =>
      Object.entries(supplierViewsData).map(([view, data]) => ({
        view,
        label: data.title,
      })),
    [],
  );

  const items = useMemo(
    () =>
      tabs.map((tab) => ({
        label: tab.label,
        route: getAllRecordsViewRouteSupplier(
          tab.view as keyof typeof supplierViewsData,
        ),
      })),
    [tabs],
  );

  const activeIndex = tabs.findIndex((tab) => tab.view === currentView);

  return <SecondaryNavbar items={items} activeIndex={activeIndex} />;
};
