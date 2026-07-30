import { getUserInfo } from "@/auth";
import { CreditApplicationForm } from "./CreditApplicationForm";
import { getCreditApplicationAttachmentDownloadUrls } from "../actions";
import { AttachmentDownload } from "@/app/lib/constants/attachment";
import { getOrgInfo } from "../services";
import {
  getCreditApplication,
  getApplicationHistories,
  getLatestDraftHistory,
} from "../data";
import { getPresignedGetObjectUrl } from "@/app/lib/services/s3";
import { CreditApplicationSupplierStatus } from "@/prisma/generated/enums";

const formatDisplayDate = (d: Date) =>
  d.toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Vancouver",
  });

export const ApplicationCreateOrEdit = async (props: {
  creditApplicationId?: number;
}) => {
  const { userIsGov, userOrgId } = await getUserInfo();
  if (userIsGov) {
    return null;
  }
  let legalName;
  let serviceAddress;
  let recordsAddress;
  let makes;
  let supplierStatus: CreditApplicationSupplierStatus | undefined;
  let applicationFile: AttachmentDownload | null = null;
  let attachments: AttachmentDownload[] = [];
  let statusInfo: {
    savedAt?: string;
    savedBy?: string;
    submittedAt?: string;
    submittedBy?: string;
    rejectedAt?: string;
    issuedAt?: string;
  } = {};

  if (props.creditApplicationId) {
    const [application, attachmentsResp, draftHistory, histories] =
      await Promise.all([
        getCreditApplication(props.creditApplicationId),
        getCreditApplicationAttachmentDownloadUrls(props.creditApplicationId),
        getLatestDraftHistory(props.creditApplicationId),
        getApplicationHistories(props.creditApplicationId),
      ]);
    if (!application) {
      return null;
    }
    applicationFile = {
      url: await getPresignedGetObjectUrl(application.objectName),
      fileName: application.fileName,
    };
    legalName = application.legalName;
    recordsAddress = application.recordsAddress;
    serviceAddress = application.serviceAddress;
    makes = application.makes;
    supplierStatus = application.supplierStatus;
    if (attachmentsResp.responseType === "data") {
      attachments = attachmentsResp.data;
    }
    if (draftHistory) {
      statusInfo.savedAt = formatDisplayDate(draftHistory.timestamp);
      statusInfo.savedBy = `${draftHistory.user.firstName} ${draftHistory.user.lastName}`;
    }
    const submission = histories
      .filter((h) => h.userAction === "SUBMITTED")
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
    if (submission) {
      statusInfo.submittedAt = formatDisplayDate(submission.timestamp);
      statusInfo.submittedBy = `${submission.user.firstName} ${submission.user.lastName}`;
    } else if (application.submissionTimestamp) {
      statusInfo.submittedAt = formatDisplayDate(application.submissionTimestamp);
    }
    const rejection = histories
      .filter((h) => h.userAction === "REJECTED")
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
    if (rejection) {
      statusInfo.rejectedAt = formatDisplayDate(rejection.timestamp);
    }
    const issued = histories
      .filter((h) => h.userAction === "APPROVED")
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
    if (issued) {
      statusInfo.issuedAt = formatDisplayDate(issued.timestamp);
    }
  } else {
    const orgInfo = await getOrgInfo(userOrgId);
    legalName = orgInfo.name;
    recordsAddress = orgInfo.recordsAddress;
    serviceAddress = orgInfo.serviceAddress;
    makes = orgInfo.makes;
  }
  return (
    <div className="bg-white">
      {props.creditApplicationId && applicationFile ? (
        <CreditApplicationForm
          legalName={legalName}
          recordsAddress={recordsAddress}
          serviceAddress={serviceAddress}
          makes={makes}
          supplierStatus={supplierStatus}
          statusInfo={statusInfo}
          creditApplication={{
            id: props.creditApplicationId,
            applicationFile,
            attachments: attachments,
          }}
        />
      ) : (
        <CreditApplicationForm
          legalName={legalName}
          recordsAddress={recordsAddress}
          serviceAddress={serviceAddress}
          makes={makes}
          supplierStatus={supplierStatus}
        />
      )}
    </div>
  );
};
