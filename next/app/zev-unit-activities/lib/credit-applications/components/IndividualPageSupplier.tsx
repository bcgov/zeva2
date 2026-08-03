import { getUserInfo } from "@/auth";
import { CreditApplicationSupplierStatus } from "@/prisma/generated/enums";
import {
  getCreditApplication,
  getApplicationHistories,
  getLatestDraftHistory,
} from "../data";
import { StatusBanner } from "@/app/lib/components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload } from "@fortawesome/free-solid-svg-icons";
import { Suspense } from "react";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import {
  getCreditApplicationAttachmentDownloadUrls,
  getCreditApplicationDownloadUrl,
} from "../actions";
import { Attachments } from "@/app/lib/components/Attachments";
import { SupplierActions } from "./SupplierActions";
import { ApplicationStatisticsSupplier } from "./ApplicationStatisticsSupplier";
import { PrintDownloadButton } from "@/app/lib/components/PrintDownloadButton";

const formatDate = (d: Date) =>
  d.toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Vancouver",
  });

export const IndividualPageSupplier = async (props: { id: string }) => {
  const id = Number.parseInt(props.id, 10);
  const { userIsGov, userRoles } = await getUserInfo();
  if (userIsGov) {
    return null;
  }
  const creditApplication = await getCreditApplication(id);
  if (!creditApplication) {
    return null;
  }
  const applicationSupplierStatus = creditApplication.supplierStatus;
  const downloadApplication = async () => {
    "use server";
    return getCreditApplicationDownloadUrl(id);
  };
  const downloadAttachments = async () => {
    "use server";
    return getCreditApplicationAttachmentDownloadUrls(id);
  };

  const [histories, draftHistory] = await Promise.all([
    getApplicationHistories(id),
    getLatestDraftHistory(id),
  ]);
  const latestRejection = histories
    .filter((h) => h.userAction === "REJECTED")
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
  const latestRejectionComment = latestRejection?.comment;
  const latestRejectionTimestamp = latestRejection?.timestamp;

  const latestIssuedTimestamp = histories
    .filter((h) => h.userAction === "APPROVED")
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0]
    ?.timestamp;

  const latestSubmission = histories
    .filter((h) => h.userAction === "SUBMITTED")
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
  const submitterName = latestSubmission
    ? `${latestSubmission.user.firstName} ${latestSubmission.user.lastName}`
    : creditApplication.legalName;

  const draftSavedBy = draftHistory
    ? `${draftHistory.user.firstName} ${draftHistory.user.lastName}`
    : creditApplication.legalName;

  let statusBanner = null;
  if (applicationSupplierStatus === CreditApplicationSupplierStatus.DRAFT) {
    statusBanner = (
      <StatusBanner
        title="STATUS - Draft."
        primaryText={
          draftHistory
            ? `CA-${id} Excel template ${creditApplication.fileName} uploaded and auto-saved, ${formatDate(draftHistory.timestamp)} by ${draftSavedBy}, awaiting submission to Government of B.C.`
            : `CA-${id} awaiting submission to Government of B.C.`
        }
      />
    );
  } else if (
    applicationSupplierStatus === CreditApplicationSupplierStatus.SUBMITTED
  ) {
    statusBanner = (
      <StatusBanner
        title="STATUS - Submitted."
        primaryText={
          creditApplication.submissionTimestamp
            ? `CA-${id} submitted to Government of B.C. ${formatDate(creditApplication.submissionTimestamp)}, by ${submitterName}. Awaiting review by Government of B.C.`
            : `CA-${id} submitted to Government of B.C. Awaiting review by Government of B.C.`
        }
      />
    );
  } else if (
    applicationSupplierStatus === CreditApplicationSupplierStatus.REJECTED
  ) {
    statusBanner = (
      <StatusBanner
        title="STATUS - Rejected."
        primaryText={
          latestRejectionTimestamp
            ? `CA-${id} rejected ${formatDate(latestRejectionTimestamp)} by Government of B.C.`
            : "Your credit application has been rejected by Government of B.C."
        }
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
  } else if (
    applicationSupplierStatus === CreditApplicationSupplierStatus.APPROVED
  ) {
    statusBanner = (
      <StatusBanner
        title="STATUS - Issued."
        primaryText={
          latestIssuedTimestamp
            ? `CA-${id} issued ${formatDate(latestIssuedTimestamp)} by Government of B.C.`
            : "Your credit application has been issued by Government of B.C."
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row items-center justify-between p-5 rounded-t bg-[#E7E7E7]">
        <div className="text-[26px] font-bold">
          Credit Application ID {id}, {creditApplication.legalName}
        </div>
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
          <ApplicationStatisticsSupplier creditApplicationId={id} />
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
