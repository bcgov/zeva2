import { ContentCard } from "@/app/lib/components";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { getUserInfo } from "@/auth";
import { JSX, Suspense } from "react";
import { SupplementaryAnalystActions } from "./SupplementaryAnalystActions";
import { SupplementarySupplierActions } from "./SupplementarySupplierActions";
import { SupplementaryReportHistory } from "./SupplementaryReportHistory";
import { SupplementaryReportDetails } from "./SupplementaryReportDetails";
import {
  ModelYear,
  ModelYearReportStatus,
  Role,
} from "@/prisma/generated/enums";
import { SystemDetails } from "./SystemDetails";
import { getMyrStatusEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { mapOfStatusToSupplierStatus } from "../constants";
import { AssessmentDetails } from "./AssessmentDetails";

// used for both legacy and non-legacy supplementaries
export const Supplementary = async (props: {
  suppId: number;
  orgName: string;
  modelYear: ModelYear;
  status: ModelYearReportStatus;
  suppReassessmentExists: boolean;
  myrId?: number;
}) => {
  const { userIsGov, userRoles } = await getUserInfo();
  let statusToUse = props.status;
  let actionComponent: JSX.Element | null = null;
  if (userIsGov) {
    if (userRoles.includes(Role.DIRECTOR)) {
    } else if (userRoles.includes(Role.ZEVA_IDIR_USER)) {
      actionComponent = (
        <SupplementaryAnalystActions
          suppId={props.suppId}
          status={props.status}
          suppReassessmentExists={props.suppReassessmentExists}
          myrId={props.myrId}
        />
      );
    }
  } else {
    statusToUse = mapOfStatusToSupplierStatus[statusToUse];
    actionComponent = (
      <SupplementarySupplierActions
        suppId={props.suppId}
        status={statusToUse}
        myrId={props.myrId}
      />
    );
  }
  const statusMap = getMyrStatusEnumsToStringsMap();
  return (
    <div className="flex flex-col w-1/3">
      <ContentCard title="Supplementary Report History">
        <Suspense fallback={<LoadingSkeleton />}>
          <SupplementaryReportHistory suppId={props.suppId} />
        </Suspense>
      </ContentCard>
      <ContentCard title="System Details">
        <SystemDetails
          userIsGov={userIsGov}
          orgName={props.orgName}
          modelYear={props.modelYear}
          status={statusMap[statusToUse] ?? ""}
        />
      </ContentCard>
      <ContentCard title="The Supplementary Report">
        <Suspense fallback={<LoadingSkeleton />}>
          <SupplementaryReportDetails suppId={props.suppId} />
        </Suspense>
      </ContentCard>
      <ContentCard title="The Associated Reassessment">
        <Suspense fallback={<LoadingSkeleton />}>
          <AssessmentDetails type="assessment" id={props.suppId} />
        </Suspense>
      </ContentCard>
      <ContentCard title="Actions">
        <Suspense fallback={<LoadingSkeleton />}>{actionComponent}</Suspense>
      </ContentCard>
    </div>
  );
};
