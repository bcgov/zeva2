import { StatusBanner } from "@/app/lib/components";
import { getModelYearEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { ModelYear } from "@/prisma/generated/enums";

export const SupplementaryStatusBanner = (props: {
  userIsGov: boolean;
  complianceYear: ModelYear;
}) => {
  const modelYearsMap = getModelYearEnumsToStringsMap();
  const myString = modelYearsMap[props.complianceYear];
  if (!myString) {
    return null;
  }
  return (
    <StatusBanner
      title="Reminder:"
      primaryText={
        props.userIsGov
          ? `The supplier may need to submit a ${myString} Supplementary Report if they haven't already.`
          : `You may need to submit a ${myString} Supplementary Report if you haven't already.`
      }
      variant="info"
    />
  );
};
