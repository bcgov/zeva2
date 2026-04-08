import { JSX } from "react";
import { getCreditTransferHistories } from "../data";
import { getUserInfo } from "@/auth";
import { getCreditTransferStatusEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { getIsoYmdString, getTimeWithTz } from "@/app/lib/utils/date";

export const CreditTransferHistories = async (props: { id: number }) => {
  const histories = await getCreditTransferHistories(props.id);
  if (histories.length === 0) {
    return null;
  }
  const { userIsGov } = await getUserInfo();
  const statusMap = getCreditTransferStatusEnumsToStringsMap();
  const entries: JSX.Element[] = [];
  histories.forEach((history) => {
    let name = `${history.user.firstName} ${history.user.lastName}`;
    if (!userIsGov && history.user.organization.isGovernment) {
      name = "Government of BC";
    }
    entries.push(
      <li key={history.id}>
        <p key="content">
          {`[${name}] made the transfer "${statusMap[history.userAction]}" on 
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
