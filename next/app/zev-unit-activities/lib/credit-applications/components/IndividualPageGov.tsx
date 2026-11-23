import { getUserInfo } from "@/auth";
import { CreditApplicationStatus, Role } from "@/prisma/generated/enums";
import { getApplicationHistories } from "../data";
import { StatusBanner } from "@/app/lib/components";
import {
  analystAddComment,
  analystEditOrDeleteComment,
  getAnalystCommentsAction,
  getCreditApplicationAttachmentDownloadUrls,
} from "../actions";
import { Attachments } from "@/app/lib/components/Attachments";
import { DirectorActions } from "./DirectorActions";
import { AnalystActions } from "./AnalystActions";
import { ApplicationStatisticsGov } from "./ApplicationStatisticsGov";
import { ApplicationSummaryCards } from "./ApplicationSummaryCards";
import { CommentChat } from "@/app/lib/components/CommentChat";
import { PrintDownloadButton } from "@/app/lib/components/PrintDownloadButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload } from "@fortawesome/free-solid-svg-icons";
import { JSX } from "react";
import { getIsoYmdString } from "@/app/lib/utils/date";
import { RecommendationSummary } from "./RecommendationSummary";
import {
  getApplicationStatisticsGov,
  getCreditApplicationGov,
} from "../services";
import { getMostRecentValidationData } from "../utilsServer";
import { SupplementaryStatusBanner } from "./SupplementaryStatusBanner";

export const IndividualPageGov = async (props: { id: string }) => {
  const id = Number.parseInt(props.id, 10);
  const { userIsGov, userRoles, userId } = await getUserInfo();
  if (!userIsGov) {
    return null;
  }
  const creditApplication = await getCreditApplicationGov(id, userRoles);
  if (!creditApplication || !creditApplication.complianceYear) {
    return null;
  }
  const applicationStatus = creditApplication.status;
  const latestValidation = getMostRecentValidationData(
    creditApplication.CreditApplicationHistory,
  );
  const validationTs = latestValidation?.timestamp;
  const validatedBy = latestValidation?.user;
  const downloadAttachments = async () => {
    "use server";
    return getCreditApplicationAttachmentDownloadUrls(id);
  };

  // assumes "histories" are in ascending order
  const histories = await getApplicationHistories(id);
  let dateToUseForStats = new Date();
  for (const history of histories) {
    if (history.userAction === CreditApplicationStatus.ISSUED) {
      dateToUseForStats = history.timestamp;
    }
  }
  const stats = await getApplicationStatisticsGov(id, dateToUseForStats);

  let statusBanner: JSX.Element | null = null;
  let supplementaryStatusBanner: JSX.Element | null = null;
  if (
    applicationStatus === CreditApplicationStatus.VALIDATED &&
    validationTs &&
    validatedBy
  ) {
    statusBanner = (
      <StatusBanner
        variant="validated"
        title="STATUS: Validated."
        primaryText={`CA-${id} checked against ICBC registration data ${getIsoYmdString(validationTs)} by ${validatedBy.firstName} ${validatedBy.lastName}.`}
      />
    );
  } else if (applicationStatus === CreditApplicationStatus.SUBMITTED) {
    const history = histories.find(
      (h) => h.userAction === CreditApplicationStatus.SUBMITTED,
    );
    if (history) {
      statusBanner = (
        <StatusBanner
          variant="draft"
          title="STATUS: Submitted."
          primaryText={`CA-${id} submitted to Government of B.C. ${getIsoYmdString(history.timestamp)}, by ${creditApplication.organization.name}. Awaiting review by Government of B.C.`}
        />
      );
    }
  } else if (
    applicationStatus === CreditApplicationStatus.RETURNED_TO_ANALYST &&
    validationTs &&
    validatedBy
  ) {
    const history = histories.findLast(
      (h) => h.userAction === CreditApplicationStatus.RETURNED_TO_ANALYST,
    );
    if (history) {
      statusBanner = (
        <StatusBanner
          variant="returned"
          title="STATUS: Returned to Analyst."
          primaryText={`CA-${id} returned to analyst on ${getIsoYmdString(history.timestamp)}. Last checked against ICBC registration data on ${getIsoYmdString(validationTs)} by ${validatedBy.firstName} ${validatedBy.lastName}.`}
          secondaryText={
            history.comment && (
              <span>
                <span className="font-bold">Comment from Director:</span>{" "}
                {history.comment}
              </span>
            )
          }
        />
      );
    }
  } else if (applicationStatus === CreditApplicationStatus.RECOMMENDED) {
    const history = histories.findLast(
      (h) => h.userAction === CreditApplicationStatus.RECOMMENDED,
    );
    if (history) {
      statusBanner = (
        <StatusBanner
          variant="warning"
          title="STATUS: Recommended."
          primaryText={`CA-${id} reviewed and recommended to Director ${getIsoYmdString(history.timestamp)} by ${history.user.firstName} ${history.user.lastName}.`}
        />
      );
    }
  } else if (applicationStatus === CreditApplicationStatus.ISSUED) {
    const history = histories.find(
      (h) => h.userAction === CreditApplicationStatus.ISSUED,
    );
    if (history) {
      statusBanner = (
        <StatusBanner
          variant="success"
          title="STATUS: Issued."
          primaryText={`CA-${id} issued ${getIsoYmdString(history.timestamp)} by ${history.user.firstName} ${history.user.lastName}.`}
        />
      );
    }
  } else if (applicationStatus === CreditApplicationStatus.REJECTED) {
    const history = histories.findLast(
      (h) => h.userAction === CreditApplicationStatus.REJECTED,
    );
    if (history) {
      statusBanner = (
        <StatusBanner
          variant="error"
          title="STATUS: Rejected."
          primaryText={`CA-${id} rejected ${getIsoYmdString(history.timestamp)} by ${history.user.firstName} ${history.user.lastName}.`}
        />
      );
    }
  }
  if (creditApplication.isSupplementary) {
    supplementaryStatusBanner = (
      <SupplementaryStatusBanner
        userIsGov={true}
        complianceYear={creditApplication.complianceYear}
      />
    );
  }
  const applicationData = (
    <>
      {statusBanner}
      {supplementaryStatusBanner}
      {stats && <ApplicationSummaryCards stats={stats} />}
      {stats && (
        <ApplicationStatisticsGov
          stats={stats.map((stat) => {
            return {
              ...stat,
              creditsSum: stat.creditsSum.toString(),
              validCreditsSum: stat.validCreditsSum.toString(),
            };
          })}
          validated={!!latestValidation}
        />
      )}
      <div className="flex flex-col rounded border border-dividerMedium">
        <div className="px-5 py-4 text-xl font-bold bg-disabledSurface">
          Supporting Documents
        </div>
        <Attachments
          attachments={creditApplication.CreditApplicationAttachment}
          download={downloadAttachments}
          zipName={`credit-application-attachments-${id}`}
        />
      </div>
    </>
  );

  let actionComponent;
  if (userRoles.includes(Role.ZEVA_IDIR_USER)) {
    actionComponent = <AnalystActions id={id} status={applicationStatus} />;
  } else if (userRoles.includes(Role.DIRECTOR)) {
    actionComponent = <DirectorActions id={id} status={applicationStatus} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row items-center justify-between p-5 rounded-t bg-whisperGray">
        <div className="text-[26px] font-bold">
          Credit Application ID {id}, {creditApplication.organization.name}
        </div>
        <div className="px-4 py-1">
          <PrintDownloadButton icon={<FontAwesomeIcon icon={faDownload} />}>
            Print/Download Page
          </PrintDownloadButton>
        </div>
      </div>
      {applicationData}
      <CommentChat
        objectId={id}
        editable={
          userRoles.includes(Role.ZEVA_IDIR_USER) &&
          (applicationStatus === CreditApplicationStatus.SUBMITTED ||
            applicationStatus === CreditApplicationStatus.VALIDATED ||
            applicationStatus === CreditApplicationStatus.RETURNED_TO_ANALYST)
        }
        userId={userId}
        getComments={getAnalystCommentsAction}
        addComment={analystAddComment}
        editOrDeleteComment={analystEditOrDeleteComment}
      />
      {stats && applicationStatus !== CreditApplicationStatus.REJECTED && (
        <RecommendationSummary stats={stats} />
      )}
      {actionComponent}
    </div>
  );
};
