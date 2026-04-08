import { JSX } from "react";
import { getAgreementHistories } from "../data";
import { getUserInfo } from "@/auth";
import { getIsoYmdString, getTimeWithTz } from "@/app/lib/utils/date";
import { getAgreementStatusEnumsToStringsMap } from "@/app/lib/utils/enumMaps";

export const AgreementHistory = async (props: { agreementId: number }) => {
  const histories = await getAgreementHistories(props.agreementId);
  if (histories.length === 0) {
    return null;
  }
  const statusMap = getAgreementStatusEnumsToStringsMap();
  const { userIsGov } = await getUserInfo();
  const entries: JSX.Element[] = [];
  for (const history of histories) {
    let name = `${history.user.firstName} ${history.user.lastName}`;
    if (!userIsGov && history.user.organization.isGovernment) {
      name = "Government of BC";
    }
    entries.push(
      <li key={history.id}>
        <p>
          {`[${name}] made the report "${statusMap[history.userAction]}" on 
                  ${getIsoYmdString(history.timestamp)}, at ${getTimeWithTz(history.timestamp)}.`}
        </p>
        {history.comment && (
          <p>{`Comment associated with this history entry, written by [${name}]: "${history.comment}"`}</p>
        )}
      </li>,
    );
  }
  return (
    <div className="mt-4">
      <p className="py-1 font-semibold text-primaryBlue">History</p>
      <div className="p-2 border border-gray-300 rounded bg-white">
        <ul className="space-y-3">{entries}</ul>
      </div>
    </div>
  );
};
