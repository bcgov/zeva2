"use client";

import { useRouter } from "next/navigation";
import { JSX, useMemo } from "react";
import { ModelYear } from "@/prisma/generated/enums";
import { myrSuppBannerIndicators } from "../constants";
import { getModelYearEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { StatusBanner, StatusBannerVariant } from "@/app/lib/components";
import { Routes } from "@/app/lib/constants";
import { getAdjacentYear } from "@/app/lib/utils/complianceYear";

export const MyrSuppBanner = (props: {
  type: "myr" | "supp";
  currentTabIndex: number;
  visibleTabIndices: number[];
  // map of tab indices to relative urls
  clickableTabs: Partial<Record<number, string>>;
  // map of tab indices to keys that maps to utility classes
  tabIndicators: Partial<Record<number, keyof typeof myrSuppBannerIndicators>>;
  modelYear?: ModelYear;
  statusBanner?: {
    variant: StatusBannerVariant;
    title: string;
    primaryText?: string;
  };
  bottomBanner?: JSX.Element;
}) => {
  const router = useRouter();

  const heading = useMemo(() => {
    let result =
      props.type === "myr" ? "Model Year Report" : "Supplementary Report";
    if (props.modelYear) {
      const modelYearsMap = getModelYearEnumsToStringsMap();
      const my = modelYearsMap[props.modelYear];
      result = `${result} ${my}`;
    }
    return result;
  }, [props.type, props.modelYear]);

  const statusHeading = useMemo(() => {
    if (props.statusBanner) {
      return (
        <StatusBanner
          variant={props.statusBanner.variant}
          title={props.statusBanner.title}
          primaryText={props.statusBanner.primaryText}
        />
      );
    }
    return null;
  }, [props.statusBanner]);

  // indices used in props are wrt this array
  const tabs = useMemo(() => {
    const type = props.type;
    return [
      "Report Information",
      "Review and Submit",
      "Submission",
      type === "myr" ? "Generate Assessment" : "Generate Reassessment",
      type === "myr" ? "Assessment" : "Reassessment",
      "Supplementary Reports and Reassessments",
    ];
  }, [props.type]);

  const tabsJSX = useMemo(() => {
    const result: JSX.Element[] = [];
    for (const [index, label] of tabs.entries()) {
      if (props.visibleTabIndices.includes(index)) {
        const isCurrentTab = props.currentTabIndex === index;
        const link = props.clickableTabs[index];
        const indicatorClasses = props.tabIndicators[index]
          ? myrSuppBannerIndicators[props.tabIndicators[index]]
          : "";
        result.push(
          <div
            key={index}
            className={`flex-1 border-b-8 pb-1 text-center ${indicatorClasses} ${link ? "cursor-pointer" : ""} ${isCurrentTab ? "font-bold" : ""}`}
            onClick={
              link
                ? () => {
                    router.push(link);
                  }
                : () => {}
            }
          >
            {label}
          </div>,
        );
      }
    }
    return result;
  }, [
    tabs,
    props.currentTabIndex,
    props.visibleTabIndices,
    props.clickableTabs,
    props.tabIndicators,
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="text-2xl font-bold">{heading}</div>
      {statusHeading}
      <hr className="border-dividerMedium"></hr>
      <div className="flex flex-row">{tabsJSX}</div>
      {props.bottomBanner}
      <hr className="border-dividerMedium"></hr>
    </div>
  );
};
