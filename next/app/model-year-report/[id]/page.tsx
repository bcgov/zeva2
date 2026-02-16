import { ContentCard } from "@/app/lib/components";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { getUserInfo } from "@/auth";
import { JSX, Suspense } from "react";
import { ModelYearReportDetails } from "../lib/components/ModelYearReportDetails";
import { ModelYearReportHistory } from "../lib/components/ModelYearReportHistory";
import { getModelYearReport } from "../lib/data";
import { SupplierActions } from "../lib/components/SupplierActions";
import { Role } from "@/prisma/generated/enums";
import { DirectorActions } from "../lib/components/DirectorActions";
import { AnalystActions } from "../lib/components/AnalystActions";
import { AssessmentDetails } from "../lib/components/AssessmentDetails";
import { ForecastReportDetails } from "../lib/components/ForecastReportDetails";
import { ReassessmentsList } from "../lib/components/ReassessmentsList";
import { SupplementaryList } from "../lib/components/SupplementaryList";
import {
  getDataForReassessment,
  getDataForSupplementary,
} from "../lib/services";
import { SystemDetails } from "../lib/components/SystemDetails";
import { getMyrStatusEnumsToStringsMap } from "@/app/lib/utils/enumMaps";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const args = await props.params;
  const myrId = parseInt(args.id, 10);
  const myr = await getModelYearReport(myrId);
  if (!myr) {
    return null;
  }
  const status = myr.status;
  const supplierStatus = myr.supplierStatus;
  const { userIsGov, userRoles } = await getUserInfo();
  let actionComponent: JSX.Element | null = null;
  if (userIsGov) {
    if (userRoles.includes(Role.DIRECTOR)) {
      actionComponent = <DirectorActions myrId={myrId} status={status} />;
    } else if (userRoles.includes(Role.ZEVA_IDIR_USER)) {
      let canCreateReassessment = true;
      try {
        await getDataForReassessment(myr.organizationId, myr.modelYear);
      } catch {
        canCreateReassessment = false;
      }
      actionComponent = (
        <AnalystActions
          myrId={myrId}
          status={status}
          assessmentExists={!!myr.assessment}
          canCreateReassessment={canCreateReassessment}
        />
      );
    }
  } else {
    let canCreateSupplementary = true;
    try {
      await getDataForSupplementary(myr.organizationId, myr.modelYear);
    } catch {
      canCreateSupplementary = false;
    }
    actionComponent = (
      <SupplierActions
        myrId={myrId}
        status={supplierStatus}
        canCreateSupplementary={canCreateSupplementary}
      />
    );
  }
  const statusMap = getMyrStatusEnumsToStringsMap();
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
      <ContentCard title="System Details">
        <SystemDetails
          userIsGov={userIsGov}
          orgName={myr.organization.name}
          modelYear={myr.modelYear}
          status={
            userIsGov
              ? (statusMap[status] ?? "")
              : (statusMap[supplierStatus] ?? "")
          }
        />
      </ContentCard>
      <ContentCard title="The Model Year Report">
        <Suspense fallback={<LoadingSkeleton />}>
          <ModelYearReportDetails id={myrId} />
        </Suspense>
      </ContentCard>
      <ContentCard title="The Forecast Report">
        <Suspense fallback={<LoadingSkeleton />}>
          <ForecastReportDetails myrId={myrId} />
        </Suspense>
      </ContentCard>
      <ContentCard title="The Assessment">
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
