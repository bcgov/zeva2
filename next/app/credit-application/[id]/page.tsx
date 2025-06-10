import { getUserInfo } from "@/auth";
import { Role } from "@/prisma/generated/client";
import { getCreditApplication } from "../lib/data";
import { ContentCard } from "@/app/lib/components";
import { DownloadSupplierFile } from "../lib/components/DownloadSupplierFile";
import { AnalystView } from "../lib/components/AnalystView";
import { DirectorView } from "../lib/components/DirectorView";
import { Suspense } from "react";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { ApplicationHistories } from "../lib/components/ApplicationHistories";
import { ApplicationDetails } from "../lib/components/ApplicationDetails";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const args = await props.params;
  const id = parseInt(args.id, 10);
  const creditApplication = await getCreditApplication(id);
  if (!creditApplication) {
    return null;
  }
  const { userIsGov, userRoles } = await getUserInfo();
  const applicationData = (
    <>
      <ContentCard title="Application Details">
        <ApplicationDetails
          application={creditApplication}
          userIsGov={userIsGov}
        />
      </ContentCard>
      <ContentCard title="Application History">
        <Suspense fallback={<LoadingSkeleton />}>
          <ApplicationHistories id={id} />
        </Suspense>
      </ContentCard>
      <ContentCard title="Download Submission">
        <DownloadSupplierFile creditApplicationId={id} userIsGov={userIsGov} />
      </ContentCard>
    </>
  );

  if (userIsGov) {
    const applicationStatus = creditApplication.status;
    if (userRoles.some((role) => role === Role.ENGINEER_ANALYST)) {
      return (
        <div>
          {applicationData}
          <ContentCard title="Actions">
            <AnalystView id={id} status={applicationStatus} />
          </ContentCard>
        </div>
      );
    } else if (userRoles.some((role) => role === Role.DIRECTOR)) {
      return (
        <div>
          {applicationData}
          <ContentCard title="Actions">
            <DirectorView id={id} status={applicationStatus} />
          </ContentCard>
        </div>
      );
    }
  }
  return <div>{applicationData}</div>;
};

export default Page;
