import { JSX } from "react";
import {
  getMyrStatusEnumsToStringsMap,
  getReassessmentStatusEnumsToStringsMap,
} from "@/app/lib/utils/enumMaps";
import Link from "next/link";
import { getReassessments, getSupplementaries } from "../data";
import { Routes } from "@/app/lib/constants";
import { getUserInfo } from "@/auth";
import {
  ModelYearReportStatus,
  ReassessmentStatus,
} from "@/prisma/generated/enums";
import { getIsoYmdString } from "@/app/lib/utils/date";

export const ReassessmentsAndSupplementaryReports = async (props: {
  myrId: number;
}) => {
  const { userIsGov } = await getUserInfo();
  const reassessments = await getReassessments(props.myrId);
  const supplementaries = await getSupplementaries(props.myrId);
  if (reassessments.length === 0 && supplementaries.length === 0) {
    return null;
  }
  const topList: [
    (
      | ((typeof reassessments)[number] & { type: "reassessment" })
      | ((typeof supplementaries)[number] & { type: "supp" })
    ),
    Date,
  ][] = [];
  const bottomList: (
    | ((typeof reassessments)[number] & { type: "reassessment" })
    | ((typeof supplementaries)[number] & { type: "supp" })
  )[] = [];
  for (const reassessment of reassessments) {
    let foundHistory;
    if (userIsGov) {
      foundHistory = reassessment.ReassessmentHistory.find(
        (history) =>
          history.userAction === ReassessmentStatus.SUBMITTED_TO_DIRECTOR,
      );
    } else {
      foundHistory = reassessment.ReassessmentHistory.find(
        (history) => history.userAction === ReassessmentStatus.ISSUED,
      );
    }
    if (foundHistory) {
      topList.push([
        { ...reassessment, type: "reassessment" },
        foundHistory.timestamp,
      ]);
    } else {
      bottomList.push({ ...reassessment, type: "reassessment" });
    }
  }
  for (const supp of supplementaries) {
    const foundHistory = supp.SupplementaryReportHistory.find(
      (history) =>
        history.userAction === ModelYearReportStatus.SUBMITTED_TO_GOVERNMENT,
    );
    if (foundHistory) {
      topList.push([{ ...supp, type: "supp" }, foundHistory.timestamp]);
    } else {
      bottomList.push({ ...supp, type: "supp" });
    }
  }
  topList.sort((a, b) => {
    const tsA = a[1];
    const tsB = b[1];
    if (tsA < tsB) {
      return -1;
    } else if (tsB < tsA) {
      return 1;
    }
    return 0;
  });
  const reassessmentStatusMap = getReassessmentStatusEnumsToStringsMap();
  const suppStatusMap = getMyrStatusEnumsToStringsMap();
  const entries: JSX.Element[] = [];
  for (const item of topList) {
    const obj = item[0];
    const date = getIsoYmdString(item[1]);
    const id = obj.id;
    if (obj.type === "reassessment") {
      entries.push(
        <li key={`r-${id}`} className="text-primaryBlue hover:underline">
          <Link
            href={`${Routes.ModelYearReports}/${props.myrId}/reassessment/${id}`}
          >
            {`Reassessment - ${reassessmentStatusMap[obj.status]} - ${date}`}
          </Link>
        </li>,
      );
    } else {
      entries.push(
        <li key={`s-${id}`} className="text-primaryBlue hover:underline">
          <Link
            href={`${Routes.ModelYearReports}/${props.myrId}/supplementary/${id}`}
          >
            {`Supplementary Report - ${suppStatusMap[obj.status]} - ${date}`}
          </Link>
        </li>,
      );
    }
  }
  for (const item of bottomList) {
    const id = item.id;
    if (item.type === "reassessment") {
      entries.push(
        <li key={`r-${id}`} className="text-primaryBlue hover:underline">
          <Link
            href={`${Routes.ModelYearReports}/${props.myrId}/reassessment/${id}`}
          >
            {`Reassessment - ${reassessmentStatusMap[item.status]}`}
          </Link>
        </li>,
      );
    } else {
      entries.push(
        <li key={`s-${id}`} className="text-primaryBlue hover:underline">
          <Link
            href={`${Routes.ModelYearReports}/${props.myrId}/supplementary/${id}`}
          >
            {`Supplementary Report - ${suppStatusMap[item.status]}`}
          </Link>
        </li>,
      );
    }
  }
  return <ul className="space-y-3">{entries}</ul>;
};
