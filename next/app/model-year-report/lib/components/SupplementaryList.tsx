import { JSX } from "react";
import Link from "next/link";
import { Routes } from "@/app/lib/constants";
import { getSupplementaries } from "../data";
import { getMyrStatusEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { getUserInfo } from "@/auth";
import { mapOfStatusToSupplierStatus } from "../constants";

export const SupplementaryList = async (props: { myrId: number }) => {
  const { userIsGov } = await getUserInfo();
  const supplementaries = await getSupplementaries(props.myrId);
  if (supplementaries.length === 0) {
    return null;
  }
  const statusMap = getMyrStatusEnumsToStringsMap();
  const entries: JSX.Element[] = [];
  for (const supp of supplementaries) {
    const id = supp.id;
    const status = userIsGov
      ? supp.status
      : mapOfStatusToSupplierStatus[supp.status];
    entries.push(
      <li key={id} className="text-primaryBlue hover:underline">
        <Link
          href={`${Routes.ComplianceReporting}/${props.myrId}/supplementary/${id}`}
        >
          {`Supplementary Report ${id} - ${statusMap[status]}`}
        </Link>
      </li>,
    );
  }
  return <ul className="space-y-3">{entries}</ul>;
};
