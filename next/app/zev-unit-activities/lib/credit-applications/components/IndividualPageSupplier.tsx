import { getUserInfo } from "@/auth";
import {
  CreditApplicationStatus,
  CreditApplicationSupplierStatus,
} from "@/prisma/generated/enums";
import { getCreditApplication, getApplicationHistories } from "../data";
import { StatusBanner } from "@/app/lib/components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload } from "@fortawesome/free-solid-svg-icons";
import { JSX, Suspense } from "react";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import {
  getCreditApplicationAttachmentDownloadUrls,
  getCreditApplicationDownloadUrl,
} from "../actions";
import { Attachments } from "@/app/lib/components/Attachments";
import { SupplierActions } from "./SupplierActions";
import { ApplicationStatisticsSupplier } from "./ApplicationStatisticsSupplier";
import { PrintDownloadButton } from "@/app/lib/components/PrintDownloadButton";
import { getIsoYmdString } from "@/app/lib/utils/date";

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

  // assumes "histories" are in ascending order
  const histories = await getApplicationHistories(id);
  let statusBanner: JSX.Element | null = null;
  if (applicationSupplierStatus === CreditApplicationSupplierStatus.DRAFT) {
    const history = histories.findLast(
      (h) => h.userAction === CreditApplicationStatus.DRAFT,
    );
    if (history) {
      statusBanner = (
        <StatusBanner
          title="STATUS - Draft."
          primaryText={`CA-${id} Excel template ${creditApplication.fileName} uploaded and auto-saved, ${getIsoYmdString(history.timestamp)} by ${history.user.firstName} ${history.user.lastName}, awaiting submission to Government of B.C.`}
        />
      );
    }
  } else if (
    applicationSupplierStatus === CreditApplicationSupplierStatus.SUBMITTED
  ) {
    const history = histories.find(
      (h) => h.userAction === CreditApplicationStatus.SUBMITTED,
    );
    if (history) {
      statusBanner = (
        <StatusBanner
          title="STATUS - Submitted."
          primaryText={`CA-${id} submitted to Government of B.C. ${getIsoYmdString(history.timestamp)}, by ${history.user.firstName} ${history.user.lastName}. Awaiting review by Government of B.C.`}
        />
      );
    }
  } else if (
    applicationSupplierStatus === CreditApplicationSupplierStatus.REJECTED
  ) {
    const history = histories.find(
      (h) => h.userAction === CreditApplicationStatus.REJECTED,
    );
    if (history) {
      statusBanner = (
        <StatusBanner
          title="STATUS - Rejected."
          primaryText={`CA-${id} rejected ${getIsoYmdString(history.timestamp)} by Government of B.C.`}
          secondaryText={
            history.comment && (
              <div>
                <strong>Official Comment from Government of B.C.:</strong>{" "}
                {history.comment}
              </div>
            )
          }
        />
      );
    }
  } else if (
    applicationSupplierStatus === CreditApplicationSupplierStatus.APPROVED
  ) {
    const history = histories.find(
      (h) => h.userAction === CreditApplicationStatus.APPROVED,
    );
    if (history) {
      statusBanner = (
        <StatusBanner
          title="STATUS - Issued."
          primaryText={`CA-${id} issued ${getIsoYmdString(history.timestamp)} by Government of B.C.`}
        />
      );
    }
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

      {statusBanner}
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
