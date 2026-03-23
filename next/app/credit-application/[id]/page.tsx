import { getUserInfo } from "@/auth";
import { Role } from "@/prisma/generated/enums";
import { getCreditApplication } from "../lib/data";
import { ContentCard } from "@/app/lib/components";
import { Suspense } from "react";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { ApplicationHistories } from "../lib/components/ApplicationHistories";
import { ApplicationDetails } from "../lib/components/ApplicationDetails";
import {
  getCreditApplicationAttachmentDownloadUrls,
  getCreditApplicationDownloadUrl,
} from "../lib/actions";
import { Attachments } from "@/app/lib/components/Attachments";
import { SupplierActions } from "../lib/components/SupplierActions";
import { DirectorActions } from "../lib/components/DirectorActions";
import { AnalystActions } from "../lib/components/AnalystActions";
import { ApplicationStatistics } from "../lib/components/ApplicationStatistics";
import { getPartOfMyrModelYear } from "../lib/services";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const args = await props.params;
  const id = Number.parseInt(args.id, 10);
  const creditApplication = await getCreditApplication(id);
  if (!creditApplication) {
    return null;
  }
  const applicationStatus = creditApplication.status;
  const applicationSupplierStatus = creditApplication.supplierStatus;
  const { userIsGov, userOrgId, userRoles } = await getUserInfo();
  const downloadApplication = async () => {
    "use server";
    return getCreditApplicationDownloadUrl(id);
  };
  const downloadAttachments = async () => {
    "use server";
    return getCreditApplicationAttachmentDownloadUrls(id);
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
      <ContentCard title="Application Statistics">
        <Suspense fallback={<LoadingSkeleton />}>
          <ApplicationStatistics
            creditApplicationId={id}
            userIsGov={userIsGov}
          />
        </Suspense>
      </ContentCard>
      {!userIsGov && (
        <ContentCard title="The Credit Application">
          <Attachments
            attachments={[{ fileName: creditApplication.fileName }]}
            download={downloadApplication}
            zipName={`credit-application-${id}`}
          />
        </ContentCard>
      )}
      <ContentCard title="Supporting Documents">
        <Attachments
          attachments={creditApplication.CreditApplicationAttachment}
          download={downloadAttachments}
          zipName={`credit-application-attachments-${id}`}
        />
      </ContentCard>
    </>
  );

  if (userIsGov) {
    if (userRoles.includes(Role.ZEVA_IDIR_USER)) {
      return (
        <div className="flex flex-col w-1/3">
          {applicationData}
          <ContentCard title="Actions">
            <AnalystActions
              id={id}
              status={applicationStatus}
              validatedBefore={
                creditApplication.lastValidatedTimestamp !== null
              }
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
  const partOfMyrModelYear = await getPartOfMyrModelYear(userOrgId);
  return (
    <div className="flex flex-col w-1/3">
      {applicationData}
      <ContentCard title="Actions">
        <SupplierActions
          creditApplicationId={id}
          status={applicationSupplierStatus}
          userRoles={userRoles}
          partOfMyrModelYear={partOfMyrModelYear}
        />
      </ContentCard>
    </div>
  );
};

export default Page;
