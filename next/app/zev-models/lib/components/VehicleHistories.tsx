import { getUserInfo } from "@/auth";
import { getVehicleHistories } from "../data";
import { getIsoYmdString, getTimeWithTz } from "@/app/lib/utils/date";
import { JSX } from "react";
import { getVehicleStatusEnumsToStringsMap } from "@/app/lib/utils/enumMaps";

export const VehicleHistories = async (props: { id: number }) => {
  const histories = await getVehicleHistories(props.id);
  if (histories.length === 0) {
    return null;
  }
  const { userIsGov } = await getUserInfo();
  const statusMap = getVehicleStatusEnumsToStringsMap();
  const entries: JSX.Element[] = [];
  histories.forEach((history) => {
    let name = `${history.user.firstName} ${history.user.lastName}`;
    if (!userIsGov && history.user.organization.isGovernment) {
      name = "Government of BC";
    }
    entries.push(
      <li key={history.id}>
        <p key="content">
          {`[${name}] made the vehicle "${statusMap[history.userAction]}" on 
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
