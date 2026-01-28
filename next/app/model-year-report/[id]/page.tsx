import { ContentCard } from "@/app/lib/components";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { getUserInfo } from "@/auth";
import { JSX, Suspense } from "react";
import { ModelYearReportDetails } from "../lib/components/ModelYearReportDetails";
import { ModelYearReportHistory } from "../lib/components/ModelYearReportHistory";
import { getModelYearReport } from "../lib/data";
import { SupplierActions } from "../lib/components/SupplierActions";
import { ModelYearReportStatus, Role } from "@/prisma/generated/client";
import { DirectorActions } from "../lib/components/DirectorActions";
import { AnalystActions } from "../lib/components/AnalystActions";
import { AssessmentDetails } from "../lib/components/AssessmentDetails";
import { ForecastReportDetails } from "../lib/components/ForecastReportDetails";
import { ReassessmentsList } from "../lib/components/ReassessmentsList";
import { SupplementaryList } from "../lib/components/SupplementaryList";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const args = await props.params;
  const myrId = parseInt(args.id, 10);
  const myr = await getModelYearReport(myrId);
  if (!myr) {
    return null;
  }
  const status = myr.status;
  const { userIsGov, userRoles } = await getUserInfo();
  let actionComponent: JSX.Element | null = null;
  if (!userIsGov) {
    actionComponent = (
      <SupplierActions myrId={myrId} status={myr.supplierStatus} />
    );
  } else if (userRoles.includes(Role.DIRECTOR)) {
    actionComponent = <DirectorActions myrId={myrId} status={status} />;
  } else if (userRoles.includes(Role.ZEVA_IDIR_USER)) {
    actionComponent = (
      <AnalystActions
        id={myrId}
        status={status}
        canConductReassessment={status === ModelYearReportStatus.ASSESSED}
      />
    );
  }

  return (
    <div className="flex flex-col w-1/3">
      <ContentCard title="Reassessments">
        <Suspense fallback={<LoadingSkeleton />}>
          <ReassessmentsList myrId={myrId} />
        </Suspense>
      </ContentCard>
      <ContentCard title="Supplementary Reports">
        <Suspense fallback={<LoadingSkeleton />}>
          <SupplementaryList myrId={myrId} />
        </Suspense>
      </ContentCard>
      <ContentCard title="Model Year Report History">
        <Suspense fallback={<LoadingSkeleton />}>
          <ModelYearReportHistory id={myrId} />
        </Suspense>
      </ContentCard>
      <ContentCard title="Model Year Report Details">
        <Suspense fallback={<LoadingSkeleton />}>
          <ModelYearReportDetails id={myrId} />
        </Suspense>
      </ContentCard>
      <ContentCard title="Forecast Report Details">
        <Suspense fallback={<LoadingSkeleton />}>
          <ForecastReportDetails myrId={myrId} />
        </Suspense>
      </ContentCard>
      <ContentCard title="Assessment Details">
        <Suspense fallback={<LoadingSkeleton />}>
          <AssessmentDetails type="assessment" id={myrId} />
        </Suspense>
      </ContentCard>
      <ContentCard title="Actions">
        <Suspense fallback={<LoadingSkeleton />}>{actionComponent}</Suspense>
      </ContentCard>
    </div>
  );
};

export default Page;
