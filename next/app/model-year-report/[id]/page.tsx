import { ContentCard } from "@/app/lib/components";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { getUserInfo } from "@/auth";
import { JSX, Suspense } from "react";
import { ModelYearReportDetails } from "../lib/components/ModelYearReportDetails";
import { ModelYearReportHistory } from "../lib/components/ModelYearReportHistory";
import { getLatestReassessment, getModelYearReport } from "../lib/data";
import { SupplierActions } from "../lib/components/SupplierActions";
import {
  ModelYearReportStatus,
  ReassessmentStatus,
  Role,
} from "@/prisma/generated/client";
import { DirectorActions } from "../lib/components/DirectorActions";
import { AnalystActions } from "../lib/components/AnalystActions";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const args = await props.params;
  const id = parseInt(args.id, 10);
  const myr = await getModelYearReport(id);
  if (!myr) {
    return null;
  }
  const latestReassessment = await getLatestReassessment(
    myr.organizationId,
    myr.modelYear,
  );
  const status = myr.status;
  const modelYear = myr.modelYear;
  let assessableReassessmentId = null;
  let canConductReassessment = false;
  if (
    status === ModelYearReportStatus.ASSESSED &&
    latestReassessment &&
    latestReassessment.status === ReassessmentStatus.SUBMITTED_TO_DIRECTOR
  ) {
    assessableReassessmentId = latestReassessment.id;
  }
  if (
    status === ModelYearReportStatus.ASSESSED &&
    (!latestReassessment ||
      (latestReassessment &&
        (latestReassessment.status === ReassessmentStatus.ISSUED ||
          latestReassessment.status ===
            ReassessmentStatus.RETURNED_TO_ANALYST)))
  ) {
    canConductReassessment = true;
  }

  const { userIsGov, userRoles } = await getUserInfo();
  let actionComponent: JSX.Element | null = null;
  if (!userIsGov) {
    actionComponent = <SupplierActions id={id} status={status} />;
  } else if (userIsGov && userRoles.includes(Role.DIRECTOR)) {
    actionComponent = (
      <DirectorActions
        id={id}
        organizationId={myr.organizationId}
        modelYear={modelYear}
        status={status}
        assessableReassessmentId={assessableReassessmentId}
      />
    );
  } else if (userIsGov && userRoles.includes(Role.ENGINEER_ANALYST)) {
    actionComponent = (
      <AnalystActions
        id={id}
        status={status}
        canConductReassessment={canConductReassessment}
      />
    );
  }

  return (
    <div className="flex flex-col w-1/3">
      <ContentCard title="Model Year Report History">
        <Suspense fallback={<LoadingSkeleton />}>
          <ModelYearReportHistory id={id} />
        </Suspense>
      </ContentCard>
      <ContentCard title="Model Year Report Details">
        <Suspense fallback={<LoadingSkeleton />}>
          <ModelYearReportDetails id={id} />
        </Suspense>
      </ContentCard>
      <ContentCard title="Actions">
        <Suspense fallback={<LoadingSkeleton />}>{actionComponent}</Suspense>
      </ContentCard>
    </div>
  );
};

export default Page;
