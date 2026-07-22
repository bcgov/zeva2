import { getUserInfo } from "@/auth";
import {
  Role,
  CreditApplicationSupplierStatus,
} from "@/prisma/generated/enums";
import { getCreditApplication, getApplicationHistories } from "../data";
import { ContentCard, StatusBanner } from "@/app/lib/components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload } from "@fortawesome/free-solid-svg-icons";
import { Suspense } from "react";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
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
import { PrintDownloadButton } from "@/app/lib/components/PrintDownloadButton";
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
        <div className="flex flex-col">
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
        <div className="flex flex-col">
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
    .filter((h) => h.userAction === "REJECTED")
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0]?.comment;

  let statusBanner = null;
  if (applicationSupplierStatus === CreditApplicationSupplierStatus.DRAFT) {
    statusBanner = <StatusBanner title="STATUS - Draft" primaryText="" />;
  } else if (
    applicationSupplierStatus === CreditApplicationSupplierStatus.SUBMITTED
  ) {
    statusBanner = <StatusBanner title="STATUS - Submitted" primaryText="" />;
  } else if (
    applicationSupplierStatus === CreditApplicationSupplierStatus.REJECTED
  ) {
    statusBanner = (
      <StatusBanner
        title="STATUS - Rejected"
        primaryText=""
        secondaryText={
          latestRejectionComment && (
            <div>
              <strong>Official Comment from Government of B.C.:</strong>{" "}
              {latestRejectionComment}
            </div>
          )
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row items-center justify-between p-5 rounded-t bg-[#E7E7E7]">
        <div className="text-[26px] font-bold">Credit Application ID {id}, {creditApplication.legalName}</div>
        <div className="px-4 py-1">
          <PrintDownloadButton icon={<FontAwesomeIcon icon={faDownload} />}>
            Print/Download Page
          </PrintDownloadButton>
        </div>
      </div>

      {statusBanner && <>{statusBanner}</>}
      <hr className="border-dividerMedium"></hr>
      <div className="flex flex-col gap-6 self-start">
        <div className="flex flex-col border border-dividerMedium rounded">
          <div className="px-5 py-4 text-xl font-bold bg-disabledBG">
            Supplier Information
          </div>
          <div className="p-5 grid grid-cols-2 items-center gap-y-3">
            <div className="font-bold">Legal Name:</div>
            <div>{creditApplication.legalName}</div>
            <hr className="col-span-2 border-disabledBG"></hr>
            <div className="font-bold">Records Address:</div>
            <div>{creditApplication.recordsAddress}</div>
            <hr className="col-span-2 border-disabledBG"></hr>
            <div className="font-bold">Service Address:</div>
            <div>{creditApplication.serviceAddress}</div>
            <hr className="col-span-2 border-disabledBG"></hr>
            <div className="font-bold">Makes:</div>
            <div>{creditApplication.makes}</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col rounded border border-dividerMedium">
        <div className="px-5 py-4 text-xl font-bold bg-disabledSurface">
          Credit Application Details
        </div>
        <Attachments
          attachments={[{ fileName: creditApplication.fileName }]}
          download={downloadApplication}
          zipName={`credit-application-${id}`}
          includeBottomBorder={true}
        />
        <Suspense fallback={<LoadingSkeleton />}>
          <ApplicationStatistics creditApplicationId={id} userIsGov={false} />
        </Suspense>
      </div>

      <div className="flex flex-col rounded border border-dividerMedium">
        <div className="px-5 py-4 text-xl font-bold bg-disabledSurface">
          Supporting Documents (optional)
        </div>
        <Attachments
          attachments={creditApplication.CreditApplicationAttachment}
          download={downloadAttachments}
          zipName={`credit-application-attachments-${id}`}
        />
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
  );
};
