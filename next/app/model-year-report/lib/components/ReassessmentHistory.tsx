import { getUserInfo } from "@/auth";
import { getReassessmentHistory } from "../data";
import { JSX } from "react";
import { getIsoYmdString, getTimeWithTz } from "@/app/lib/utils/date";
import { getReassessmentStatusEnumsToStringsMap } from "@/app/lib/utils/enumMaps";

export const ReassessmentHistory = async (props: {
  reassessmentId: number;
}) => {
  const histories = await getReassessmentHistory(props.reassessmentId);
  if (histories.length === 0) {
    return null;
  }
  const { userIsGov } = await getUserInfo();
  const statusMap = getReassessmentStatusEnumsToStringsMap();
  const entries: JSX.Element[] = [];
  histories.forEach((history) => {
    let name = `${history.user.firstName} ${history.user.lastName}`;
    if (!userIsGov && history.user.organization.isGovernment) {
      name = "Government of BC";
    }
    entries.push(
      <li key={history.id}>
        <p key="content">
          {`[${name}] made the reassessment "${statusMap[history.userAction]}" on 
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
