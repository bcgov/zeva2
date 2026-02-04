import { ContentCard } from "@/app/lib/components";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { getUserInfo } from "@/auth";
import { JSX, Suspense } from "react";
import { getSupplementaryReport } from "@/app/model-year-report/lib/data";
import { SupplementarySupplierActions } from "@/app/model-year-report/lib/components/SupplementarySupplierActions";
import { Role } from "@/prisma/generated/client";
import { SupplementaryGovernmentActions } from "@/app/model-year-report/lib/components/SupplementaryGovernmentActions";
import { SupplementaryReportHistory } from "@/app/model-year-report/lib/components/SupplementaryReportHistory";
import { SupplementaryReportDetails } from "@/app/model-year-report/lib/components/SupplementaryReportDetails";

const Page = async (props: {
  params: Promise<{ id: string; supplementaryId: string }>;
}) => {
  const args = await props.params;
  const myrId = Number.parseInt(args.id, 10);
  const suppId = Number.parseInt(args.supplementaryId, 10);
  const report = await getSupplementaryReport(suppId);
  if (!report) {
    return null;
  }
  const status = report.status;
  const { userIsGov, userRoles } = await getUserInfo();
  let actionComponent: JSX.Element | null = null;
  if (userIsGov) {
    actionComponent = (
      <SupplementaryGovernmentActions suppId={suppId} status={status} />
    );
  } else {
    actionComponent = (
      <SupplementarySupplierActions
        suppId={suppId}
        status={status}
        myrId={myrId}
      />
    );
  }

  return (
    <div className="flex flex-col w-1/3">
      <ContentCard title="Supplementary Report History">
        <Suspense fallback={<LoadingSkeleton />}>
          <SupplementaryReportHistory suppId={suppId} />
        </Suspense>
      </ContentCard>
      <ContentCard title="Supplementary Report Details">
        <Suspense fallback={<LoadingSkeleton />}>
          <SupplementaryReportDetails suppId={suppId} />
        </Suspense>
      </ContentCard>
      <ContentCard title="Actions">
        <Suspense fallback={<LoadingSkeleton />}>{actionComponent}</Suspense>
      </ContentCard>
    </div>
  );
};

export default Page;
