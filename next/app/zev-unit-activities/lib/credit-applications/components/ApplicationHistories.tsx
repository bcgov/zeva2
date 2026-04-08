import { getIsoYmdString, getTimeWithTz } from "@/app/lib/utils/date";
import { getApplicationHistories } from "../data";
import { JSX } from "react";
import { getUserInfo } from "@/auth";
import { getCreditApplicationStatusEnumsToStringsMap } from "@/app/lib/utils/enumMaps";

export const ApplicationHistories = async (props: { id: number }) => {
  const histories = await getApplicationHistories(props.id);
  const { userIsGov } = await getUserInfo();
  if (histories.length === 0) {
    return null;
  }
  const statusMap = getCreditApplicationStatusEnumsToStringsMap();
  const entries: JSX.Element[] = [];
  histories.forEach((history) => {
    let name = `${history.user.firstName} ${history.user.lastName}`;
    if (!userIsGov && history.user.organization.isGovernment) {
      name = "Government of BC";
    }
    entries.push(
      <li key={history.id}>
        <p key="content">
          {`[${name}] made the application "${statusMap[history.userAction]}" on 
          ${getIsoYmdString(history.timestamp)}, at ${getTimeWithTz(history.timestamp)}.`}
        </p>
        {history.comment && (
          <p key="comment">
            {`Comment associated with this history entry written by [${name}]: "${history.comment}"`}
          </p>
        )}
      </li>,
    );
  });
  return <ul className="space-y-3">{entries}</ul>;
};
