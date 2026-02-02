import { getUserInfo } from "@/auth";
import { getSupplementaryHistories } from "../data";
import { JSX } from "react";
import { getIsoYmdString, getTimeWithTz } from "@/app/lib/utils/date";
import { getSupplementaryReportStatusEnumsToStringsMap } from "@/app/lib/utils/enumMaps";

export const SupplementaryReportHistory = async (props: { suppId: number }) => {
  const histories = await getSupplementaryHistories(props.suppId);
  if (histories.length === 0) {
    return null;
  }
  const { userIsGov } = await getUserInfo();
  const statusMap = getSupplementaryReportStatusEnumsToStringsMap();
  const entries: JSX.Element[] = [];
  histories.forEach((history) => {
    let name = `${history.user.firstName} ${history.user.lastName}`;
    if (!userIsGov && history.user.organization.isGovernment) {
      name = "Government of BC";
    }
    entries.push(
      <li key={history.id}>
        <p key="content">
          {`[${name}] made the report "${statusMap[history.userAction]}" on 
          ${getIsoYmdString(history.timestamp)}, at ${getTimeWithTz(history.timestamp)}.`}
        </p>
        {history.comment && (
          <p key="comment">{`Comment associated with this history entry, written by [${name}]: "${history.comment}"`}</p>
        )}
      </li>,
    );
  });
  return <ul className="space-y-3">{entries}</ul>;
};
