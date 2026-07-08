"use client";

import {
  Breadcrumbs,
  type BreadcrumbItem,
} from "@/app/lib/components/Breadcrumbs";
import { Routes } from "@/app/lib/constants";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

export const ComplianceReportingBreadcrumbs = (props: {
  slug: string;
  id: string;
}) => {
  const pathname = usePathname();
  const [items, setItems] = useState<BreadcrumbItem[]>([]);

  const basePath = useMemo(() => {
    return `/compliance-reporting/${props.slug}/${props.id}`;
  }, [props.slug, props.id]);

  const segments = useMemo(() => {
    return pathname
      .replace(basePath, "")
      .split("/")
      .filter((s) => s !== "");
  }, [pathname, basePath]);

  const isId = useCallback((s: string) => {
    return /^\d+$/.test(s);
  }, []);

  const complianceReportingItem = useMemo(
    () => ({
      label: "Compliance Reporting",
      href: Routes.ModelYearReports,
    }),
    [],
  );

  useEffect(() => {
    if (props.slug === "model-year-reports") {
      if (segments.length === 0) {
        setItems([
          { label: "Model Year Reports", href: Routes.ModelYearReports },
          { label: `MYR ${props.id}` },
        ]);
      } else if (segments.length === 1) {
        const segmentOne = segments[0];
        if (segmentOne === "audit-history") {
          setItems([
            { label: "Model Year Reports", href: Routes.ModelYearReports },
            { label: `MYR ${props.id}` },
          ]);
        } else if (segmentOne === "assessment") {
          setItems([
            { label: "Model Year Reports", href: Routes.ModelYearReports },
            {
              label: `MYR ${props.id}`,
              href: `${Routes.ModelYearReports}/${props.id}`,
            },
            { label: "Assessment" },
          ]);
        } else if (segmentOne === "edit") {
          setItems([
            { label: "Model Year Reports", href: Routes.ModelYearReports },
            {
              label: `MYR ${props.id}`,
              href: `${Routes.ModelYearReports}/${props.id}`,
            },
            { label: "Edit" },
          ]);
        } else if (segmentOne === "reassessment") {
          setItems([
            { label: "Model Year Reports", href: Routes.ModelYearReports },
            {
              label: `MYR ${props.id}`,
              href: `${Routes.ModelYearReports}/${props.id}`,
            },
            { label: "Create Reassessment" },
          ]);
        } else if (segmentOne === "reassessments-and-supplementaries") {
          setItems([
            { label: "Model Year Reports", href: Routes.ModelYearReports },
            {
              label: `MYR ${props.id}`,
              href: `${Routes.ModelYearReports}/${props.id}`,
            },
            { label: "Reassessments and Supplementaries" },
          ]);
        } else if (segmentOne === "supplementary") {
          setItems([
            { label: "Model Year Reports", href: Routes.ModelYearReports },
            {
              label: `MYR ${props.id}`,
              href: `${Routes.ModelYearReports}/${props.id}`,
            },
            { label: "Create Supplementary" },
          ]);
        }
      } else if (segments.length === 2) {
        const segmentOne = segments[0];
        const segmentTwo = segments[1];
        if (segmentOne === "assessment" && segmentTwo === "edit") {
          setItems([
            { label: "Model Year Reports", href: Routes.ModelYearReports },
            {
              label: `MYR ${props.id}`,
              href: `${Routes.ModelYearReports}/${props.id}`,
            },
            {
              label: "Assessment",
              href: `${Routes.ModelYearReports}/${props.id}/assessment`,
            },
            { label: "Edit" },
          ]);
        } else if (segmentOne === "assessment" && segmentTwo === "new") {
          setItems([
            { label: "Model Year Reports", href: Routes.ModelYearReports },
            {
              label: `MYR ${props.id}`,
              href: `${Routes.ModelYearReports}/${props.id}`,
            },
            { label: "Create Assessment" },
          ]);
        } else if (segmentOne === "reassessment" && isId(segmentTwo)) {
          setItems([
            { label: "Model Year Reports", href: Routes.ModelYearReports },
            {
              label: `MYR ${props.id}`,
              href: `${Routes.ModelYearReports}/${props.id}`,
            },
            { label: `Reassessment ${segmentTwo}` },
          ]);
        } else if (segmentOne === "supplementary" && isId(segmentTwo)) {
          setItems([
            { label: "Model Year Reports", href: Routes.ModelYearReports },
            {
              label: `MYR ${props.id}`,
              href: `${Routes.ModelYearReports}/${props.id}`,
            },
            { label: `Supplementary ${segmentTwo}` },
          ]);
        }
      } else if (segments.length === 3) {
        const segmentOne = segments[0];
        const segmentTwo = segments[1];
        const segmentThree = segments[2];
        if (
          segmentOne === "reassessment" &&
          isId(segmentTwo) &&
          segmentThree === "edit"
        ) {
          setItems([
            { label: "Model Year Reports", href: Routes.ModelYearReports },
            {
              label: `MYR ${props.id}`,
              href: `${Routes.ModelYearReports}/${props.id}`,
            },
            {
              label: `Reassessment ${segmentTwo}`,
              href: `${Routes.ModelYearReports}/${props.id}/reassessment/${segmentTwo}`,
            },
            { label: "Edit" },
          ]);
        } else if (
          segmentOne === "supplementary" &&
          isId(segmentTwo) &&
          segmentThree === "edit"
        ) {
          setItems([
            { label: "Model Year Reports", href: Routes.ModelYearReports },
            {
              label: `MYR ${props.id}`,
              href: `${Routes.ModelYearReports}/${props.id}`,
            },
            {
              label: `Supplementary ${segmentTwo}`,
              href: `${Routes.ModelYearReports}/${props.id}/supplementary/${segmentTwo}`,
            },
            { label: "Edit" },
          ]);
        } else if (
          segmentOne === "supplementary" &&
          isId(segmentTwo) &&
          segmentThree === "reassessment"
        ) {
          setItems([
            { label: "Model Year Reports", href: Routes.ModelYearReports },
            {
              label: `MYR ${props.id}`,
              href: `${Routes.ModelYearReports}/${props.id}`,
            },
            {
              label: `Supplementary ${segmentTwo}`,
              href: `${Routes.ModelYearReports}/${props.id}/supplementary/${segmentTwo}`,
            },
            { label: "Create Supplementary Reassessment" },
          ]);
        }
      } else if (segments.length === 4) {
        const segmentOne = segments[0];
        const segmentTwo = segments[1];
        const segmentThree = segments[2];
        const segmentFour = segments[3];
        if (
          segmentOne === "supplementary" &&
          isId(segmentTwo) &&
          segmentThree === "reassessment" &&
          segmentFour === "edit"
        ) {
          setItems([
            { label: "Model Year Reports", href: Routes.ModelYearReports },
            {
              label: `MYR ${props.id}`,
              href: `${Routes.ModelYearReports}/${props.id}`,
            },
            {
              label: `Supplementary ${segmentTwo}`,
              href: `${Routes.ModelYearReports}/${props.id}/supplementary/${segmentTwo}`,
            },
            { label: "Edit Supplementary Reassessment" },
          ]);
        }
      }
    } else if (props.slug === "legacy-reassessments") {
      if (segments.length === 0) {
        setItems([
          { label: "Legacy Reassessments", href: Routes.LegacyReassessments },
          { label: `Legacy Reassessment ${props.id}` },
        ]);
      } else if (segments.length === 1) {
        const segmentOne = segments[0];
        if (segmentOne === "audit-history") {
          setItems([
            { label: "Legacy Reassessments", href: Routes.LegacyReassessments },
            { label: `Legacy Reassessment ${props.id}` },
          ]);
        } else if (segmentOne === "edit") {
          setItems([
            { label: "Legacy Reassessments", href: Routes.LegacyReassessments },
            {
              label: `Legacy Reassessment ${props.id}`,
              href: `${Routes.LegacyReassessments}/${props.id}`,
            },
            { label: "Edit" },
          ]);
        }
      }
    } else if (props.slug === "legacy-supplementaries") {
      if (segments.length === 0) {
        setItems([
          { label: "Legacy Supplementaries", href: Routes.LegacySupplementary },
          { label: `Legacy Supplementary ${props.id}` },
        ]);
      } else if (segments.length === 1) {
        const segmentOne = segments[0];
        if (segmentOne === "audit-history") {
          setItems([
            {
              label: "Legacy Supplementaries",
              href: Routes.LegacySupplementary,
            },
            { label: `Legacy Supplementary ${props.id}` },
          ]);
        } else if (segmentOne === "edit") {
          setItems([
            {
              label: "Legacy Supplementaries",
              href: Routes.LegacySupplementary,
            },
            {
              label: `Legacy Supplementary ${props.id}`,
              href: `${Routes.LegacySupplementary}/${props.id}`,
            },
            { label: "Edit" },
          ]);
        } else if (segmentOne === "reassessment") {
          setItems([
            {
              label: "Legacy Supplementaries",
              href: Routes.LegacySupplementary,
            },
            {
              label: `Legacy Supplementary ${props.id}`,
              href: `${Routes.LegacySupplementary}/${props.id}`,
            },
            { label: "Create associated Reassessment" },
          ]);
        }
      } else if (segments.length === 2) {
        const segmentOne = segments[0];
        const segmentTwo = segments[1];
        if (segmentOne === "reassessment" && segmentTwo === "edit") {
          setItems([
            {
              label: "Legacy Supplementaries",
              href: Routes.LegacySupplementary,
            },
            {
              label: `Legacy Supplementary ${props.id}`,
              href: `${Routes.LegacySupplementary}/${props.id}`,
            },
            { label: "Edit associated Reassessment" },
          ]);
        }
      }
    }
  }, [segments, props.slug, props.id, isId]);

  return (
    <Breadcrumbs
      items={items.length > 0 ? [complianceReportingItem, ...items] : items}
    />
  );
};
