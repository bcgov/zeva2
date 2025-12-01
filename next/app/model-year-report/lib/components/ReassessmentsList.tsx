import { JSX } from "react";
import { getReassessmentStatusEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import Link from "next/link";
import { getReassessments } from "../data";
import { Routes } from "@/app/lib/constants";

export const ReassessmentsList = async (props: { myrId: number }) => {
  const reassessments = await getReassessments(props.myrId);
  if (reassessments.length === 0) {
    return null;
  }
  const statusMap = getReassessmentStatusEnumsToStringsMap();
  const entries: JSX.Element[] = [];
  reassessments.forEach((reassessment) => {
    const id = reassessment.id;
    entries.push(
      <li key={reassessment.id}>
        <Link
          href={`${Routes.ComplianceReporting}/${props.myrId}/reassessment/${id}`}
        >
          {`Reassessment ${reassessment.sequenceNumber} - ${statusMap[reassessment.status]}`}
        </Link>
      </li>,
    );
  });
  return <ul className="space-y-3">{entries}</ul>;
};
