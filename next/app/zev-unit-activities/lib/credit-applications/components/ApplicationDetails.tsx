import { getIsoYmdString } from "@/app/lib/utils/date";
import { CreditApplicationWithOrgAndAttachmentNames } from "../data";
import {
  getCreditApplicationStatusEnumsToStringsMap,
  getModelYearEnumsToStringsMap,
} from "@/app/lib/utils/enumMaps";

export const ApplicationDetails = async (props: {
  application: CreditApplicationWithOrgAndAttachmentNames;
  userIsGov: boolean;
}) => {
  let status = props.application.status;
  if (!props.userIsGov) {
    status = props.application.supplierStatus;
  }
  const modelYearsMap = getModelYearEnumsToStringsMap();
  const statusMap = getCreditApplicationStatusEnumsToStringsMap();
  return (
    <ul className="space-y-3">
      <li>Supplier: {props.application.organization.name}</li>
      <li>Makes: {props.application.makes}</li>
      <li>Service Address: {props.application.serviceAddress}</li>
      <li>Records Address: {props.application.recordsAddress}</li>
      {props.application.partOfMyrModelYear && (
        <li>
          Model Year of Associated Model Year Report:{" "}
          {modelYearsMap[props.application.partOfMyrModelYear]}
        </li>
      )}
      <li>Status: {statusMap[status]}</li>
      {props.userIsGov && props.application.lastValidatedTimestamp && (
        <li>
          Last Validated On:{" "}
          {getIsoYmdString(props.application.lastValidatedTimestamp)}
        </li>
      )}
    </ul>
  );
};
