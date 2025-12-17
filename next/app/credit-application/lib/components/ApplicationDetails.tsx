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
    <>
      {props.userIsGov && (
        <div>Supplier: {props.application.organization.name}</div>
      )}
      {props.application.submissionTimestamp && (
        <div>
          Submission Date:{" "}
          {getIsoYmdString(props.application.submissionTimestamp)}
        </div>
      )}
      <div>Status: {statusMap[status]}</div>
    </>
  );
};
