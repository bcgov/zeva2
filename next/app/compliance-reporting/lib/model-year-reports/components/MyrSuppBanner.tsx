"use client";

import { useRouter } from "next/navigation";
import { JSX, useMemo } from "react";
import { ModelYear, ModelYearReportStatus } from "@/prisma/generated/enums";
import { myrSuppBannerIndicators } from "../constants";
import {
  getModelYearEnumsToStringsMap,
  getMyrStatusEnumsToStringsMap,
} from "@/app/lib/utils/enumMaps";
import { StatusBanner } from "@/app/lib/components";
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
  status?: ModelYearReportStatus;
  includeGenerationinfo?: boolean;
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
      const statusToShow = statusMap[props.status];
      if (statusToShow) {
        return (
          <StatusBanner
            variant="warning"
            title={`STATUS - ${statusToShow}`}
            primaryText=""
          />
        );
      }
    } else {
      return (
        <StatusBanner variant="warning" title="STATUS - Draft" primaryText="" />
      );
    }
    return null;
  }, [props.status]);

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

  const infoJSX = useMemo(() => {
    if (props.includeGenerationinfo && props.modelYear) {
      const modelYearsMap = getModelYearEnumsToStringsMap();
      const myString = modelYearsMap[props.modelYear];
      const nextMyString =
        modelYearsMap[getAdjacentYear("next", props.modelYear)];
      const text = (
        <div className="flex flex-col gap-3">
          <span>
            If you have {myString} model year ZEVs supplied or leased before Oct
            1, {nextMyString} that have not yet been applied for credits, please
            submit a{" "}
            <a
              href={`${Routes.CreditApplications}/new`}
              className="font-bold underline text-primaryBlue"
            >
              Consumer Vehicle Supplied credit application
            </a>{" "}
            first.
          </span>
          <span className="text-sm">
            <span className="font-bold">Submitted</span> - VINs included in
            credit applications that are awaiting government review.
          </span>
          <span className="text-sm">
            <span className="font-bold">Issued</span> - VINs that have been
            verified and issued credits.
          </span>
        </div>
      );
      return (
        <StatusBanner
          variant="info"
          title="Before generating your report:"
          primaryText=""
          secondaryText={text}
        />
      );
    }
    return null;
  }, [props.includeGenerationinfo, props.modelYear]);

  return (
    <div className="flex flex-col gap-4">
      <div className="text-2xl font-bold">{heading}</div>
      {statusHeading}
      <hr className="border-dividerMedium"></hr>
      <div className="flex flex-row">{tabsJSX}</div>
      {infoJSX}
      <hr className="border-dividerMedium"></hr>
    </div>
  );
};
