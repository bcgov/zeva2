import { JSX } from "react";
import { getPenaltyCreditHistories } from "../data";
import { getIsoYmdString, getTimeWithTz } from "@/app/lib/utils/date";
import { getPenaltyCreditStatusEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { getUserInfo } from "@/auth";

export const PenaltyCreditHistory = async (props: {
  penaltyCreditId: number;
}) => {
  const histories = await getPenaltyCreditHistories(props.penaltyCreditId);
  if (histories.length === 0) {
    return null;
  }
  const { userIsGov } = await getUserInfo();
  const statusMap = getPenaltyCreditStatusEnumsToStringsMap();
  const entries: JSX.Element[] = [];
  for (const history of histories) {
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
          <p key="comment">{`Comment associated with this history entry, written by [${name}]: "${history.comment}"`}</p>
        )}
      </li>,
    );
  }
  return <ul className="space-y-3">{entries}</ul>;
};
