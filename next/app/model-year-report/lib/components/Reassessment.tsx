import { ContentCard } from "@/app/lib/components";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { getUserInfo } from "@/auth";
import { JSX, Suspense } from "react";
import { AssessmentDetails } from "./AssessmentDetails";
import { ModelYear, ReassessmentStatus, Role } from "@/prisma/generated/client";
import { ReassessmentHistory } from "./ReassessmentHistory";
import { ReassessmentAnalystActions } from "./ReassessmentAnalystActions";
import { ReassessmentDirectorActions } from "./ReassessmentDirectorActions";
import { SystemDetails } from "./SystemDetails";
import { getReassessmentStatusEnumsToStringsMap } from "@/app/lib/utils/enumMaps";

// used for both legacy and non-legacy reassessments
export const Reassessment = async (props: {
  reassessmentId: number;
  orgName: string;
  modelYear: ModelYear;
  status: ReassessmentStatus;
  sequenceNumber: number;
  myrId?: number;
}) => {
  const { userIsGov, userRoles } = await getUserInfo();
  let actionComponent: JSX.Element | null = null;
  if (userRoles.includes(Role.ZEVA_IDIR_USER)) {
    actionComponent = (
      <ReassessmentAnalystActions
        reassessmentId={props.reassessmentId}
        status={props.status}
        myrId={props.myrId}
      />
    );
  } else if (userRoles.includes(Role.DIRECTOR)) {
    actionComponent = (
      <ReassessmentDirectorActions
        reassessmentId={props.reassessmentId}
        status={props.status}
      />
    );
  }
  const statusMap = getReassessmentStatusEnumsToStringsMap();
  return (
    <div className="flex flex-col w-1/3">
      <ContentCard title="Reassessment History">
        <Suspense fallback={<LoadingSkeleton />}>
          <ReassessmentHistory reassessmentId={props.reassessmentId} />
        </Suspense>
      </ContentCard>
      <ContentCard title="System Details">
        <SystemDetails
          userIsGov={userIsGov}
          orgName={props.orgName}
          modelYear={props.modelYear}
          status={statusMap[props.status] ?? ""}
          sequenceNumber={props.sequenceNumber}
        />
      </ContentCard>
      <ContentCard title="The Reassessment">
        <Suspense fallback={<LoadingSkeleton />}>
          <AssessmentDetails type="reassessment" id={props.reassessmentId} />
        </Suspense>
      </ContentCard>
      <ContentCard title="Actions">
        <Suspense fallback={<LoadingSkeleton />}>{actionComponent}</Suspense>
      </ContentCard>
    </div>
  );
};
