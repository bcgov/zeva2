import { ContentCard } from "@/app/lib/components";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { getUserInfo } from "@/auth";
import { JSX, Suspense } from "react";
import { ModelYearReportDetails } from "../lib/components/ModelYearReportDetails";
import { ModelYearReportHistory } from "../lib/components/ModelYearReportHistory";
import { getModelYearReport } from "../lib/data";
import { SupplierActions } from "../lib/components/SupplierActions";
import { Role } from "@/prisma/generated/client";
import { DirectorActions } from "../lib/components/DirectorActions";
import { AnalystActions } from "../lib/components/AnalystActions";
import { DownloadDocuments } from "../lib/components/DownloadDocuments";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const args = await props.params;
  const id = parseInt(args.id, 10);
  const myr = await getModelYearReport(id);
  if (!myr) {
    return null;
  }
  const status = myr.status;
  const modelYear = myr.modelYear;

  const { userIsGov, userRoles } = await getUserInfo();
  let actionComponent: JSX.Element | null = null;
  if (!userIsGov) {
    actionComponent = <SupplierActions id={id} status={status} />;
  } else if (userIsGov && userRoles.includes(Role.DIRECTOR)) {
    actionComponent = (
      <DirectorActions id={id} status={status} modelYear={modelYear} />
    );
  } else if (userIsGov && userRoles.includes(Role.ENGINEER_ANALYST)) {
    actionComponent = <AnalystActions id={id} status={status} />;
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
      <ContentCard title="Model Year Report Documents">
        <Suspense fallback={<LoadingSkeleton />}>
          <DownloadDocuments id={id} />
        </Suspense>
      </ContentCard>
      <ContentCard title="Actions">
        <Suspense fallback={<LoadingSkeleton />}>{actionComponent}</Suspense>
      </ContentCard>
    </div>
  );
};

export default Page;
