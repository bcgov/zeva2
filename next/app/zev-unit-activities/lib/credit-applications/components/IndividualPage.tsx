import { getUserInfo } from "@/auth";
import { Role, CreditApplicationSupplierStatus } from "@/prisma/generated/enums";
import { getCreditApplication, getApplicationHistories } from "../data";
import { Button, ContentCard, StatusBanner } from "@/app/lib/components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload } from "@fortawesome/free-solid-svg-icons";
import { Suspense } from "react";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { ApplicationHistories } from "./ApplicationHistories";
import { ApplicationDetails } from "./ApplicationDetails";
import {
  getCreditApplicationAttachmentDownloadUrls,
  getCreditApplicationDownloadUrl,
} from "../actions";
import { Attachments } from "@/app/lib/components/Attachments";
import { SupplierActions } from "./SupplierActions";
import { DirectorActions } from "./DirectorActions";
import { AnalystActions } from "./AnalystActions";
import { ApplicationStatistics } from "./ApplicationStatistics";
import { PrintDownloadButton } from "./PrintDownloadButton";
import {
  getComplianceYear,
  getCurrentComplianceYear,
  getDominatedComplianceYears,
} from "@/app/lib/utils/complianceYear";

export const IndividualPage = async (props: { id: string }) => {
  const id = Number.parseInt(props.id, 10);
  const creditApplication = await getCreditApplication(id);
  if (!creditApplication) {
    return null;
  }
  const applicationStatus = creditApplication.status;
  const applicationSupplierStatus = creditApplication.supplierStatus;
  const { userIsGov, userRoles } = await getUserInfo();
  const downloadApplication = async () => {
    "use server";
    return getCreditApplicationDownloadUrl(id);
  };
  const downloadAttachments = async () => {
    "use server";
    return getCreditApplicationAttachmentDownloadUrls(id);
  };

  if (userIsGov) {
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
        <ContentCard title="Supporting Documents">
          <Attachments
            attachments={creditApplication.CreditApplicationAttachment}
            download={downloadAttachments}
            zipName={`credit-application-attachments-${id}`}
          />
        </ContentCard>
      </>
    );

    if (userRoles.includes(Role.ZEVA_IDIR_USER)) {
      const caSubmittedDate = creditApplication.submissionTimestamp;
      if (!caSubmittedDate) {
        throw new Error();
      }
      const currentCy = getCurrentComplianceYear();
      const submittedCy = getComplianceYear(caSubmittedDate);
      const dominatedCys = getDominatedComplianceYears(currentCy);
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
              complianceYears={[...dominatedCys, currentCy]}
              defaultComplianceYear={submittedCy}
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

  const histories = await getApplicationHistories(id);
  const latestRejectionComment = histories
    .filter(h => h.userAction === 'REJECTED')
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0]?.comment;

  let statusBanner = null;
  if (applicationSupplierStatus === CreditApplicationSupplierStatus.DRAFT) {
    statusBanner = (
      <StatusBanner
        title="STATUS - Draft"
        primaryText=""
      />
    );
  } else if (applicationSupplierStatus === CreditApplicationSupplierStatus.SUBMITTED) {
    statusBanner = (
      <StatusBanner
        title="STATUS - Submitted"
        primaryText=""
      />
    );
  } else if (applicationSupplierStatus === CreditApplicationSupplierStatus.REJECTED) {
    statusBanner = (
      <StatusBanner
        title="STATUS - Rejected"
        primaryText=""
        secondaryText={
          latestRejectionComment && (
            <div>
              <strong>Official Comment from Government of B.C.:</strong> {latestRejectionComment}
            </div>
          )
        }
      />
    );
  }

  return (
    <div className="bg-white">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">
          Credit Application ID {id}
        </h1>
        <PrintDownloadButton icon={<FontAwesomeIcon icon={faDownload} />}>
          Print/Download Page
        </PrintDownloadButton>
      </div>

      {statusBanner && (
        <div className="px-6 pt-4 pb-2">
          {statusBanner}
        </div>
      )}

      <div className="px-6 pb-6 pt-4 space-y-6">
        <div className="border border-gray-300 bg-gray-50 rounded max-w-sm">
          <div className="p-6">
            <h2 className="text-base font-bold mb-4 text-gray-900">Supplier Information</h2>
            <div className="space-y-2 text-sm text-gray-900">
              <div>
                <span className="font-semibold">Legal Name:</span> {creditApplication.legalName}
              </div>
              <div>
                <span className="font-semibold">Record Address:</span> {creditApplication.recordsAddress}
              </div>
              <div>
                <span className="font-semibold">Service Address:</span> {creditApplication.serviceAddress}
              </div>
              <div>
                <span className="font-semibold">Makes:</span> {creditApplication.makes}
              </div>
            </div>
          </div>
        </div>

        <div className="border border-gray-300 bg-white rounded">
          <div className="p-4 bg-gray-100 border-b border-gray-300">
            <h2 className="text-base font-bold text-gray-900">Credit Application Details</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-semibold">Credit Application:</span>{" "}
                <span className="text-blue-600">{creditApplication.fileName}</span>
              </p>
              <Attachments
                attachments={[{ fileName: creditApplication.fileName }]}
                download={downloadApplication}
                zipName={`credit-application-${id}`}
                className="[&_ul]:hidden"
              />
            </div>
            <Suspense fallback={<LoadingSkeleton />}>
              <ApplicationStatistics
                creditApplicationId={id}
                userIsGov={false}
              />
            </Suspense>
          </div>
        </div>

        <div className="border border-gray-300 bg-white rounded">
          <div className="p-4 bg-gray-100 border-b border-gray-300">
            <h2 className="text-base font-bold text-gray-900">Supporting Documents (optional)</h2>
          </div>
          <div className="p-6">
            <Attachments
              attachments={creditApplication.CreditApplicationAttachment}
              download={downloadAttachments}
              zipName={`credit-application-attachments-${id}`}
            />
          </div>
        </div>

        <SupplierActions
          creditApplicationId={id}
          status={applicationSupplierStatus}
          userRoles={userRoles}
          hasInvalidatedRecords={
            creditApplication._count.CreditApplicationRecord > 0
          }
        />
      </div>
    </div>
  );
};
