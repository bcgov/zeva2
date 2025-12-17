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
import {
  getApplicationDownloadUrl,
  getAttachmentDownloadUrls,
} from "../lib/actions";
import { AttachmentsDownload } from "@/app/lib/components/AttachmentsDownload";
import { SupplierActions } from "../lib/components/SupplierActions";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const args = await props.params;
  const id = parseInt(args.id, 10);
  const creditApplication = await getCreditApplication(id);
  if (!creditApplication) {
    return null;
  }
  const applicationStatus = creditApplication.status;
  const { userIsGov, userRoles } = await getUserInfo();
  const downloadApplication = async () => {
    "use server";
    return getApplicationDownloadUrl(id);
  };
  const downloadAttachments = async () => {
    "use server";
    return getAttachmentDownloadUrls(id);
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
      <ContentCard title="Download Credit Application">
        <AttachmentsDownload download={downloadApplication} zipName="" />
      </ContentCard>
      <ContentCard title="Download Credit Application Attachments">
        {creditApplication._count.CreditApplicationAttachment > 0 && (
          <AttachmentsDownload
            download={downloadAttachments}
            zipName={`credit-application-attachments-${id}`}
          />
        )}
      </ContentCard>
    </>
  );

  if (userIsGov) {
    if (userRoles.includes(Role.ENGINEER_ANALYST)) {
      return (
        <div className="flex flex-col w-1/3">
          {applicationData}
          <ContentCard title="Actions">
            <AnalystView id={id} status={applicationStatus} />
          </ContentCard>
        </div>
      );
    } else if (userRoles.includes(Role.DIRECTOR)) {
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
