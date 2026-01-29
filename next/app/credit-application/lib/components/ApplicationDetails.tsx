import { getIsoYmdString } from "@/app/lib/utils/date";
import { CreditApplicationWithOrgAndAttachmentsCount } from "../data";
import { getCreditApplicationStatusEnumsToStringsMap } from "@/app/lib/utils/enumMaps";

export const ApplicationDetails = async (props: {
  application: CreditApplicationWithOrgAndAttachmentsCount;
  userIsGov: boolean;
}) => {
  let status = props.application.status;
  if (!props.userIsGov) {
    status = props.application.supplierStatus;
  }
  const statusMap = getCreditApplicationStatusEnumsToStringsMap();
  return (
    <ul className="space-y-3">
      <li>Supplier: {props.application.organization.name}</li>
      <li>Makes: {props.application.makes.join(", ")}</li>
      <li>Service Address: {props.application.serviceAddress}</li>
      <li>Records Address: {props.application.recordsAddress}</li>
      <li>Status: {statusMap[status]}</li>
      {props.userIsGov && props.application.icbcTimestamp && (
        <li>
          Validated using ICBC file with date:{" "}
          {getIsoYmdString(props.application.icbcTimestamp)}
        </li>
      )}
    </ul>
  );
};
