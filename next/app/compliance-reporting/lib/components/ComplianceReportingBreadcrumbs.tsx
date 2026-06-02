"use client";

import {
  Breadcrumbs,
  type BreadcrumbItem,
} from "@/app/lib/components/Breadcrumbs";
import { Routes } from "@/app/lib/constants";
import { usePathname } from "next/navigation";

const sectionLabels: Record<string, { label: string; route: Routes }> = {
  "legacy-reassessments": {
    label: "Legacy Reassessments",
    route: Routes.LegacyReassessments,
  },
  "legacy-supplementaries": {
    label: "Legacy Supplementary Reports",
    route: Routes.LegacySupplementary,
  },
  "model-year-reports": {
    label: "Model Year Reports",
    route: Routes.ModelYearReports,
  },
};

const itemLabel = (slug: string, id: string) => {
  switch (slug) {
    case "legacy-reassessments":
      return `Reassessment ${id}`;
    case "legacy-supplementaries":
      return `Supplementary Report ${id}`;
    case "model-year-reports":
      return `Model Year Report ${id}`;
    default:
      return id;
  }
};

const segmentLabel = (segment: string, id?: string) => {
  switch (segment) {
    case "assessment":
      return "Assessment";
    case "edit":
      return "Edit";
    case "new":
      return "New";
    case "reassessment":
      return id ? `Reassessment ${id}` : "Reassessment";
    case "reassessments-and-supplementaries":
      return "Supplementary Reports and Reassessments";
    case "supplementary":
      return id ? `Supplementary Report ${id}` : "Supplementary Report";
    default:
      return id ?? segment;
  }
};

export const ComplianceReportingBreadcrumbs = (props: {
  slug: string;
  id: string;
}) => {
  const pathname = usePathname();
  const section = sectionLabels[props.slug];

  if (!section) {
    return null;
  }

  const basePath = `/compliance-reporting/${props.slug}/${props.id}`;
  const segments = pathname
    .replace(basePath, "")
    .split("/")
    .filter(Boolean);
  const items: BreadcrumbItem[] = [
    { label: "Compliance Reporting", href: Routes.ModelYearReports },
    { label: section.label, href: section.route },
    { label: itemLabel(props.slug, props.id), href: basePath },
  ];

  let currentPath = basePath;
  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    const nextSegment = segments[index + 1];
    const nextIsId = nextSegment !== undefined && /^\d+$/.test(nextSegment);

    currentPath = `${currentPath}/${segment}`;

    if (nextIsId) {
      currentPath = `${currentPath}/${nextSegment}`;
      items.push({
        label: segmentLabel(segment, nextSegment),
        href: currentPath,
      });
      index += 1;
    } else {
      items.push({
        label: segmentLabel(segment),
        href: currentPath,
      });
    }
  }

  return <Breadcrumbs items={items} />;
};
