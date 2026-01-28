import { JSX } from "react";
import { getSupplementaryReportStatusEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import Link from "next/link";
import { Routes } from "@/app/lib/constants";
import { getSupplementariesByMyrId } from "../data";

export const SupplementaryList = async (props: { myrId: number }) => {
  const supplementaries = await getSupplementariesByMyrId(props.myrId);
  if (supplementaries.length === 0) {
    return null;
  }
  const statusMap = getSupplementaryReportStatusEnumsToStringsMap();
  const entries: JSX.Element[] = [];
  for (const supp of supplementaries) {
    const id = supp.id;
    entries.push(
      <li key={supp.id}>
        <Link
          href={`${Routes.ComplianceReporting}/${props.myrId}/supplementary/${id}`}
        >
          {`Supplementary Report ${supp.sequenceNumber} - ${statusMap[supp.status]}`}
        </Link>
      </li>,
    );
  }
  return <ul className="space-y-3">{entries}</ul>;
};
