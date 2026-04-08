import { JSX } from "react";
import { getPenaltyCreditHistories } from "../data";
import { getIsoYmdString, getTimeWithTz } from "@/app/lib/utils/date";
import { getPenaltyCreditStatusEnumsToStringsMap } from "@/app/lib/utils/enumMaps";

export const PenaltyCreditHistory = async (props: {
  penaltyCreditId: number;
}) => {
  const histories = await getPenaltyCreditHistories(props.penaltyCreditId);
  if (histories.length === 0) {
    return null;
  }
  const statusMap = getPenaltyCreditStatusEnumsToStringsMap();
  const entries: JSX.Element[] = [];
  histories.forEach((history) => {
    const name = `${history.user.firstName} ${history.user.lastName}`;
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
  });
  return <ul className="space-y-3">{entries}</ul>;
};
