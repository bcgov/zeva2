import { getIsoYmdString } from "@/app/lib/utils/date";
import { CreditApplicationWithOrg } from "../data";

export const ApplicationDetails = async (props: {
  application: CreditApplicationWithOrg;
  userIsGov: boolean;
}) => {
  let status = props.application.status;
  if (!props.userIsGov) {
    status = props.application.supplierStatus;
  }
  return (
    <>
      <div>Supplier: {props.application.organization.name}</div>
      <div>Date: {getIsoYmdString(props.application.submissionTimestamp)}</div>
      <div>Status: {status}</div>
    </>
  );
};
