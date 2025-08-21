import { getUserInfo } from "@/auth";
import { Role } from "@/prisma/generated/client";
import { getCreditApplication } from "../lib/data";
import { ContentCard } from "@/app/lib/components";
import { AnalystView } from "../lib/components/AnalystView";
import { DirectorView } from "../lib/components/DirectorView";
import { Suspense } from "react";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { ApplicationHistories } from "../lib/components/ApplicationHistories";
import { ApplicationDetails } from "../lib/components/ApplicationDetails";
import { ApplicationDownloads } from "../lib/components/ApplicationDownloads";

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
      <ContentCard title="Download Documents">
        <ApplicationDownloads id={id} />
      </ContentCard>
    </>
  );

  if (userIsGov) {
    const applicationStatus = creditApplication.status;
    if (userRoles.some((role) => role === Role.ENGINEER_ANALYST)) {
      return (
        <div className="flex flex-col w-1/3">
          {applicationData}
          <ContentCard title="Actions">
            <AnalystView id={id} status={applicationStatus} />
          </ContentCard>
        </div>
      );
    } else if (userRoles.some((role) => role === Role.DIRECTOR)) {
      return (
        <div className="flex flex-col w-1/3">
          {applicationData}
          <ContentCard title="Actions">
            <DirectorView id={id} status={applicationStatus} />
          </ContentCard>
        </div>
      );
    }
  }
  return <div className="flex flex-col w-1/3">{applicationData}</div>;
};

export default Page;
