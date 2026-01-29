import { ContentCard } from "@/app/lib/components";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { getUserInfo } from "@/auth";
import { JSX, Suspense } from "react";
import { AssessmentDetails } from "./AssessmentDetails";
import { ReassessmentStatus, Role } from "@/prisma/generated/client";
import { ReassessmentHistory } from "./ReassessmentHistory";
import { ReassessmentAnalystActions } from "./ReassessmentAnalystActions";
import { ReassessmentDirectorActions } from "./ReassessmentDirectorActions";

// used for both legacy and non-legacy reassessments
export const Reassessment = async (props: {
  reassessmentId: number;
  status: ReassessmentStatus;
  myrId?: number;
}) => {
  const { userRoles } = await getUserInfo();
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
  return (
    <div className="flex flex-col w-1/3">
      <ContentCard title="Reassessment History">
        <Suspense fallback={<LoadingSkeleton />}>
          <ReassessmentHistory reassessmentId={props.reassessmentId} />
        </Suspense>
      </ContentCard>
      <ContentCard title="Reassessment Details">
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
