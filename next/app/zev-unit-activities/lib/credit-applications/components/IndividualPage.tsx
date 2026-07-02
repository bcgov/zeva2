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
    <div className="flex flex-col items-start self-stretch gap-4">
      <div className="flex self-stretch items-center justify-between p-5 rounded-t bg-[#E7E7E7]">
        <div className="text-black font-['BC Sans'] text-[26px] leading-7 font-bold">
          Credit Application ID {id}
        </div>
        <div className="flex h-10 items-center justify-center gap-2 px-4 py-[5px]">
          <PrintDownloadButton icon={<FontAwesomeIcon icon={faDownload} />}>
            Print/Download Page
          </PrintDownloadButton>
        </div>
      </div>

      {statusBanner && 
        <>
          {statusBanner}
        </>}
      <div className="self-stretch h-px bg-[#898785]"></div>
      <div className="flex flex-col items-start gap-6 self-stretch bg-white">
        <div className="flex items-start gap-6 shadow-[0_2px_4px_0_rgba(0,0,0,0.08)]">
          <div className="flex w-[619px] flex-col items-start rounded-sm border border-[#898785]">
            <div className="flex flex-col items-start self-stretch gap-1 rounded-t bg-[#EDEBE9] px-5 py-4">
              <div className="self-stretch text-black font-['BC Sans'] text-[20px] leading-7 font-bold">
                Supplier Information
              </div>
            </div>
            <div className="flex flex-col items-start gap-5 rounded p-5 shadow-[0_4px_20px_0_rgba(177,177,177,0.10)]">
              <div className="flex flex-col items-start gap-3">
                <div className="flex items-center gap-4 self-stretch">
                  <div className="font-semibold w-[200px]">Legal Name:</div>{" "}
                  <div className="w-[345px]">{creditApplication.legalName}</div>
                </div>
                <div className="w-[561px] h-px bg-[#EDEBE9]"></div>
                <div className="flex items-center gap-4 self-stretch">
                  <div className="font-semibold w-[200px]">Record Address:</div>{" "}
                  <div className="w-[345px]">{creditApplication.recordsAddress}</div>
                </div>
                <div className="w-[561px] h-px bg-[#EDEBE9]"></div>
                <div className="flex items-center gap-4 self-stretch">
                  <div className="font-semibold w-[200px]">Service Address:</div>{" "}
                  <div className="w-[345px]">{creditApplication.serviceAddress}</div>
                </div>
                <div className="w-[561px] h-px bg-[#EDEBE9]"></div>
                <div className="flex items-center gap-4 self-stretch">
                  <div className="font-semibold w-[200px]">Makes:</div>{" "}
                  <div className="w-[345px]">{creditApplication.makes}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start self-stretch rounded border border-[#898785] shadow-[0_2px_4px_0_rgba(0,0,0,0.08)]">
          <div className="flex flex-col items-start self-stretch">
            <div className="flex flex-col items-start self-stretch gap-2 px-5 py-4 rounded-t border-b border-[#898785] bg-[#EDEBE9]">
              <div className="self-stretch text-[#2D2D2D] font-['BC Sans'] text-[20px] leading-7 font-bold">
                Credit Application Details
              </div>
            </div>
            <div className="flex flex-col items-start self-stretch gap-3 p-5">
              <div className="flex items-center gap-4 self-stretch">
                <div className="w-[138px] text-[#474543] font-['BC Sans'] text-base leading-6 font-normal">
                  Credit Application: 
                </div>
                <div className="flex-1 self-stretch text-[#255A90] font-['BC Sans'] text-base leading-6 font-normal underline">
                  {creditApplication.fileName}
                </div>
              </div>
              <div className="self-stretch h-px bg-[#EDEBE9]"></div>
              <div className="flex items-center">
                <Attachments
                  attachments={[{ fileName: creditApplication.fileName }]}
                  download={downloadApplication}
                  zipName={`credit-application-${id}`}
                  className="[&_ul]:hidden"
                  />
              </div>
              <div className="self-stretch h-px bg-[#EDEBE9]"></div>
            </div>
          </div>
          <Suspense fallback={<LoadingSkeleton />}>
            <ApplicationStatistics
              creditApplicationId={id}
              userIsGov={false}
            />
          </Suspense>
        </div>

        <div className="flex items-start self-stretch gap-6 shadow-[0_2px_4px_0_rgba(0,0,0,0.08)]">
          <div className="flex flex-1 flex-col items-start rounded border border-[#898785]">
            <div className="flex flex-col items-start self-stretch gap-1 rounded-t bg-[#EDEBE9] px-5 py-4">
              <div className="self-stretch text-black font-['BC Sans'] text-[20px] font-bold leading-7">
                Supporting Documents (optional)
              </div>
            </div>
            <Attachments
              attachments={creditApplication.CreditApplicationAttachment}
              download={downloadAttachments}
              zipName={`credit-application-attachments-${id}`}
              className="flex flex-col items-start self-stretch gap-3 p-5"
              label="Proof of Range: "
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
