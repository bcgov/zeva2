"use client";

import { useRouter } from "next/navigation";
import { JSX, useMemo } from "react";
import { ModelYear, ModelYearReportStatus } from "@/prisma/generated/enums";
import { myrSuppBannerIndicators } from "../constants";
import {
  getModelYearEnumsToStringsMap,
  getMyrStatusEnumsToStringsMap,
} from "@/app/lib/utils/enumMaps";

export const MyrSuppBanner = (props: {
  type: "myr" | "supp";
  currentTabIndex: number;
  visibleTabIndices: number[];
  // map of tab indices to relative urls
  clickableTabs: Partial<Record<number, string>>;
  // map of tab indices to keys that maps to utility classes
  tabIndicators: Partial<Record<number, keyof typeof myrSuppBannerIndicators>>;
  modelYear?: ModelYear;
  status?: ModelYearReportStatus;
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
    if (props.status) {
      const statusMap = getMyrStatusEnumsToStringsMap();
      return statusMap[props.status];
    }
  }, [props.status]);

  // indices used in props are wrt this array
  const tabs = useMemo(() => {
    const type = props.type;
    return [
      "Report Information",
      "Review and Submit",
      "Submission Status",
      type === "myr" ? "Assessment Information" : "Reassessment Information",
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
            className={`flex-1 border-b-4 py-0.5 text-center ${indicatorClasses} ${link ? "cursor-pointer" : ""} ${isCurrentTab ? "font-semibold" : ""}`}
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
    <div className="flex flex-col gap-2">
      <div className="text-lg font-bold">{heading}</div>
      <div>{statusHeading}</div>
      <div className="flex flex-row">{tabsJSX}</div>
    </div>
  );
};
