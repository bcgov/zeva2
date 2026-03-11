import { JSX } from "react";
import Link from "next/link";
import { Routes } from "@/app/lib/constants";
import { getSupplementaries } from "../data";
import { getMyrStatusEnumsToStringsMap } from "@/app/lib/utils/enumMaps";

export const SupplementaryList = async (props: { myrId: number }) => {
  const supplementaries = await getSupplementaries(props.myrId);
  if (supplementaries.length === 0) {
    return null;
  }
  const statusMap = getMyrStatusEnumsToStringsMap();
  const entries: JSX.Element[] = [];
  for (const supp of supplementaries) {
    const id = supp.id;
    entries.push(
      <li key={supp.id}>
        <Link
          href={`${Routes.ComplianceReporting}/${props.myrId}/supplementary/${id}`}
        >
          {`Supplementary Report ${supp.id} - ${statusMap[supp.status]}`}
        </Link>
      </li>,
    );
  }
  return <ul className="space-y-3">{entries}</ul>;
};
