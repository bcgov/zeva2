"use client";

import { SecondaryNavbar } from "@/app/lib/components/SecondaryNavbar";
import { Routes } from "@/app/lib/constants";
import { CreditApplicationStatus, Role } from "@/prisma/generated/enums";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const itemKeys = [
  "details",
  "validated",
  "validatedReadOnly",
  "modelNameMismatches",
  "auditHistory",
] as const;
type Tab = {
  label: string;
  route: string;
  key: (typeof itemKeys)[number];
};

// for gov users only
export const CreditApplicationTabs = (props: {
  creditApplicationId: string;
  creditApplicationStatus: CreditApplicationStatus;
  validatedBefore: boolean;
  userRoles: Role[];
}) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const baseRoute = `${Routes.CreditApplications}/${props.creditApplicationId}`;

  const [activeIndex, setActiveIndex] = useState(-1);

  const tabs: Tab[] = useMemo(() => {
    return [
      {
        label: `Credit Application ${props.creditApplicationId}`,
        route: `${baseRoute}/details`,
        key: itemKeys[0],
      },
      ...(props.validatedBefore &&
      props.creditApplicationStatus === CreditApplicationStatus.SUBMITTED &&
      !props.userRoles.includes(Role.DIRECTOR)
        ? [
            {
              label: "Edit Validated Records",
              route: `${baseRoute}/validated`,
              key: itemKeys[1],
            },
          ]
        : []),
      ...(props.validatedBefore
        ? [
            {
              label: "View Validated Records",
              route: `${baseRoute}/validated?readOnly=Y`,
              key: itemKeys[2],
            },
          ]
        : []),
      ...(props.validatedBefore
        ? [
            {
              label: "Model Mismatches",
              route: `${baseRoute}/model-name-mismatches`,
              key: itemKeys[3],
            },
          ]
        : []),
      {
        label: "Audit History",
        route: `${baseRoute}/audit-history`,
        key: itemKeys[4],
      },
    ];
  }, [
    props.creditApplicationId,
    props.creditApplicationStatus,
    props.validatedBefore,
    props.userRoles,
    baseRoute,
  ]);

  useEffect(() => {
    if (pathname.endsWith("details")) {
      setActiveIndex(tabs.findIndex((tab) => tab.key === "details"));
    } else if (pathname.endsWith("validated")) {
      if (searchParams.get("readOnly") !== "Y") {
        setActiveIndex(tabs.findIndex((tab) => tab.key === "validated"));
      } else {
        setActiveIndex(
          tabs.findIndex((tab) => tab.key === "validatedReadOnly"),
        );
      }
    } else if (pathname.endsWith("model-name-mismatches")) {
      setActiveIndex(
        tabs.findIndex((tab) => tab.key === "modelNameMismatches"),
      );
    } else if (pathname.endsWith("audit-history")) {
      setActiveIndex(tabs.findIndex((tab) => tab.key === "auditHistory"));
    }
  }, [pathname, searchParams, tabs]);

  return <SecondaryNavbar items={tabs} activeIndex={activeIndex} />;
};
