import { getIsoYmdString, getTimeWithTz } from "@/app/lib/utils/date";
import { getApplicationHistories } from "../data";
import { JSX } from "react";
import { getUserInfo } from "@/auth";

export const ApplicationHistories = async (props: { id: number }) => {
  const histories = await getApplicationHistories(props.id);
  const { userIsGov } = await getUserInfo();
  if (histories.length > 0) {
    const entries: JSX.Element[] = [];
    histories.forEach((history) => {
      let name = `${history.user.firstName} ${history.user.lastName}`;
      if (!userIsGov && history.user.organization.isGovernment) {
        name = "Government of BC";
      }
      entries.push(
        <div key={history.id}>
          <div>{`The user ${name} made the application ${history.userAction} on ${getIsoYmdString(history.timestamp)}, at ${getTimeWithTz(history.timestamp)}`}</div>
          {history.comment && (
            <div>
              {`Comment associated with this history entry: ${history.comment}`}
            </div>
          )}
        </div>,
      );
    });
    return <>{entries}</>;
  }
  return null;
};
