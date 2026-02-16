import { getModelYearEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { ModelYear } from "@/prisma/generated/enums";

export const SystemDetails = (props: {
  userIsGov: boolean;
  orgName: string;
  modelYear: ModelYear;
  status: string;
  sequenceNumber?: number;
}) => {
  const modelYearsMap = getModelYearEnumsToStringsMap();
  return (
    <ul className="space-y-3">
      {props.userIsGov && <li>Supplier: {props.orgName}</li>}
      <li>Model Year: {modelYearsMap[props.modelYear]}</li>
      <li>Status: {props.status}</li>
      {props.sequenceNumber !== undefined && (
        <li>Sequence Number: {props.sequenceNumber}</li>
      )}
    </ul>
  );
};
