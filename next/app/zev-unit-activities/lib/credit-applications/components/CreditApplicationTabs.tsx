"use client";

import { Routes } from "@/app/lib/constants";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type Tab = {
  label: string;
  route: string;
  isActive: (pathname: string, readOnly: boolean) => boolean;
};

export const CreditApplicationTabs = (props: {
  creditApplicationId: string;
  validatedBefore: boolean;
}) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const baseRoute = `${Routes.CreditApplications}/${props.creditApplicationId}`;
  const recordsRoute = `${baseRoute}/validated`;
  const readOnly = searchParams.get("readOnly") === "Y";

  const tabs: Tab[] = [
    {
      label: `Credit Application ${props.creditApplicationId}`,
      route: `${baseRoute}/details`,
      isActive: (currentPathname) => currentPathname.endsWith("/details"),
    },
    {
      label: "All Records",
      route: recordsRoute,
      isActive: (currentPathname, isReadOnly) =>
        currentPathname.endsWith("/validated") && !isReadOnly,
    },
    ...(props.validatedBefore
      ? [
          {
            label: "Validated Records",
            route: `${recordsRoute}?readOnly=Y`,
            isActive: (currentPathname: string, isReadOnly: boolean) =>
              currentPathname.endsWith("/validated") && isReadOnly,
          },
        ]
      : []),
    {
      label: "Model Mismatches",
      route: `${baseRoute}/model-name-mismatches`,
      isActive: (currentPathname) =>
        currentPathname.endsWith("/model-name-mismatches"),
    },
    {
      label: "Audit History",
      route: `${baseRoute}/audit-history`,
      isActive: (currentPathname) =>
        currentPathname.endsWith("/audit-history"),
    },
  ];

  return (
    <nav
      aria-label="Credit application sections"
      className="m-2 mb-4 flex gap-2 border-b border-gray-400"
    >
      {tabs.map((tab) => {
        const isActive = tab.isActive(pathname, readOnly);
        return (
          <Link
            key={tab.label}
            aria-current={isActive ? "page" : undefined}
            className={
              "-mb-px rounded-t border-l border-r border-t px-4 py-2.5 text-sm" +
              (isActive
                ? " border-gray-400 border-b-white bg-white text-black"
                : " border-gray-300 border-b-gray-400 text-[#255A90] hover:bg-[#F7F9FC]")
            }
            href={tab.route}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
};
