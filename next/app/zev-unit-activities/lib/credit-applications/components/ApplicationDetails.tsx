import { getIsoYmdString } from "@/app/lib/utils/date";
import { CreditApplicationWithOrgAndAttachmentNamesAndInvalidatedRecordsCount } from "../data";
import { getModelYearEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { getCreditApplicationStatusLabel } from "../status";

export const ApplicationDetails = async (props: {
  application: CreditApplicationWithOrgAndAttachmentNamesAndInvalidatedRecordsCount;
  userIsGov: boolean;
}) => {
  let status = props.application.status;
  if (!props.userIsGov) {
    status = props.application.supplierStatus;
  }
  const modelYearsMap = getModelYearEnumsToStringsMap();
  const statusLabel = getCreditApplicationStatusLabel(status);
  return (
    <ul className="space-y-3">
      <li>Supplier: {props.application.organization.name}</li>
      <li>Makes: {props.application.makes}</li>
      <li>Service Address: {props.application.serviceAddress}</li>
      <li>Records Address: {props.application.recordsAddress}</li>
      <li>Status: {statusLabel}</li>
      {props.userIsGov && props.application.complianceYear && (
        <li>
          Compliance Year: {modelYearsMap[props.application.complianceYear]}
        </li>
      )}
      {props.userIsGov && props.application.latestValidation && (
        <li>
          Last Validated On:{" "}
          {getIsoYmdString(props.application.latestValidation.timestamp)}
        </li>
      )}
    </ul>
  );
};
