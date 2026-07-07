import { StatusBanner } from "@/app/lib/components";
import { Routes } from "@/app/lib/constants";
import { getAdjacentYear } from "@/app/lib/utils/complianceYear";
import { getModelYearEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { ModelYear } from "@/prisma/generated/enums";

export const ReportGenerationInfo = (props: { modelYear: ModelYear }) => {
  const modelYearsMap = getModelYearEnumsToStringsMap();
  const myString = modelYearsMap[props.modelYear];
  const nextMyString = modelYearsMap[getAdjacentYear("next", props.modelYear)];
  const text = (
    <div className="flex flex-col gap-3">
      <span>
        If you have {myString} model year ZEVs supplied or leased before Oct 1,{" "}
        {nextMyString} that have not yet been applied for credits, please submit
        a{" "}
        <a
          href={`${Routes.CreditApplications}/new`}
          className="font-bold underline text-primaryBlue"
        >
          Consumer Vehicle Supplied credit application
        </a>{" "}
        first.
      </span>
      <span className="text-sm">
        <span className="font-bold">Submitted</span> - VINs included in credit
        applications that are awaiting government review.
      </span>
      <span className="text-sm">
        <span className="font-bold">Issued</span> - VINs that have been verified
        and issued credits.
      </span>
    </div>
  );
  return (
    <StatusBanner
      variant="info"
      title="Before generating your report:"
      primaryText=""
      secondaryText={text}
    />
  );
};
