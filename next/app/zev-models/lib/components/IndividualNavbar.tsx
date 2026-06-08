"use client";

import { Breadcrumbs } from "@/app/lib/components";
import { SecondaryNavbar } from "@/app/lib/components/SecondaryNavbar";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

export const IndividualNavbar = (props: {
  slug: string;
  vehicleId: number;
  modelName: string;
}) => {
  const pathname = usePathname();
  const items = useMemo(() => {
    return [
      {
        label: `ZEV Model ${props.modelName}`,
        route: `/zev-models/${props.slug}/${props.vehicleId}/details`,
      },
      {
        label: "Audit History",
        route: `/zev-models/${props.slug}/${props.vehicleId}/audit-history`,
      },
    ];
  }, [props.slug, props.vehicleId, props.modelName]);

  if (pathname.endsWith("details") || pathname.endsWith("audit-history")) {
    return (
      <>
        <Breadcrumbs
          items={[
            { label: "ZEV Models", href: `/zev-models/${props.slug}` },
            { label: props.modelName },
          ]}
        />
        <SecondaryNavbar items={items} />
      </>
    );
  } else if (pathname.endsWith("edit")) {
    return (
      <Breadcrumbs
        items={[
          { label: "ZEV Models", href: `/zev-models/${props.slug}` },
          {
            label: props.modelName,
            href: `/zev-models/${props.slug}/${props.vehicleId}`,
          },
          { label: "Edit" },
        ]}
      />
    );
  }
  return null;
};
