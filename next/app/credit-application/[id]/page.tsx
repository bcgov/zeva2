import { getUserInfo } from "@/auth";
import { Role } from "@/prisma/generated/client";
import { getCreditApplication } from "../lib/data";
import { ContentCard } from "@/app/lib/components";
import { Suspense } from "react";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { ApplicationHistories } from "../lib/components/ApplicationHistories";
import { ApplicationDetails } from "../lib/components/ApplicationDetails";
import { getDocumentDownloadUrls } from "../lib/actions";
import { AttachmentsDownload } from "@/app/lib/components/AttachmentsDownload";
import { SupplierActions } from "../lib/components/SupplierActions";
import { DirectorActions } from "../lib/components/DirectorActions";
import { AnalystActions } from "../lib/components/AnalystActions";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const args = await props.params;
  const id = Number.parseInt(args.id, 10);
  const creditApplication = await getCreditApplication(id);
  if (!creditApplication) {
    return null;
  }
  const applicationStatus = creditApplication.status;
  const { userIsGov, userRoles } = await getUserInfo();
  const download = async () => {
    "use server";
    return getDocumentDownloadUrls(id);
  };

  const applicationData = (
    <>
      <ContentCard title="Application History">
        <Suspense fallback={<LoadingSkeleton />}>
          <ApplicationHistories id={id} />
        </Suspense>
      </ContentCard>
      <ContentCard title="Application Details">
        <ApplicationDetails
          application={creditApplication}
          userIsGov={userIsGov}
        />
      </ContentCard>
      <ContentCard title="Download Documents">
        <AttachmentsDownload
          download={download}
          zipName={`credit-application-attachments-${id}`}
        />
      </ContentCard>
    </>
  );

  if (userIsGov) {
    if (userRoles.includes(Role.ENGINEER_ANALYST)) {
      return (
        <div className="flex flex-col w-1/3">
          {applicationData}
          <ContentCard title="Actions">
            <AnalystActions
              id={id}
              status={applicationStatus}
              validatedBefore={creditApplication.icbcTimestamp !== null}
            />
          </ContentCard>
        </div>
      );
    } else if (userRoles.includes(Role.DIRECTOR)) {
      return (
        <div className="flex flex-col w-1/3">
          {applicationData}
          <ContentCard title="Actions">
            <DirectorActions id={id} status={applicationStatus} />
          </ContentCard>
        </div>
      );
    }
  }
  return (
    <div className="flex flex-col w-1/3">
      {applicationData}
      <ContentCard title="Actions">
        <SupplierActions
          creditApplicationId={id}
          status={applicationStatus}
          userRoles={userRoles}
        />
      </ContentCard>
    </div>
  );
};

export default Page;
