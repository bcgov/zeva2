import { getUserInfo } from "@/auth";
import {
  CreditApplicationStatus,
  ModelYear,
  Role,
} from "@/prisma/generated/enums";
import {
  getCreditApplication,
  getApplicationStatisticsGov,
  getApplicationHistories,
} from "../data";
import { ContentCard, StatusBanner } from "@/app/lib/components";
import { ApplicationDetails } from "./ApplicationDetails";
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
import {
  getComplianceYear,
  getCurrentComplianceYear,
  getDominatedComplianceYears,
} from "@/app/lib/utils/complianceYear";
import { CommentChat } from "@/app/lib/components/CommentChat";
import { JSX } from "react";
import { getIsoYmdString } from "@/app/lib/utils/date";
import { RecommendationSummary } from "./RecommendationSummary";

export const IndividualPageGov = async (props: { id: string }) => {
  const id = Number.parseInt(props.id, 10);
  const { userIsGov, userRoles, userId } = await getUserInfo();
  if (!userIsGov) {
    return null;
  }
  const creditApplication = await getCreditApplication(id);
  if (!creditApplication) {
    return null;
  }
  const applicationStatus = creditApplication.status;
  const validationTs = creditApplication.lastValidatedTimestamp;
  const validatedBy = creditApplication.validatedBy;
  const downloadAttachments = async () => {
    "use server";
    return getCreditApplicationAttachmentDownloadUrls(id);
  };

  // assumes "histories" are in ascending order
  const [stats, histories] = await Promise.all([
    getApplicationStatisticsGov(id),
    getApplicationHistories(id),
  ]);

  let statusBanner: JSX.Element | null = null;
  if (
    applicationStatus === CreditApplicationStatus.SUBMITTED &&
    validationTs &&
    validatedBy
  ) {
    const history = histories.find(
      (h) => h.userAction === CreditApplicationStatus.SUBMITTED,
    );
    if (history) {
      statusBanner = (
        <StatusBanner
          variant="validated"
          title="STATUS: Validated."
          primaryText={`CA-${id} checked against ICBC registration data ${getIsoYmdString(validationTs)} by ${validatedBy.firstName} ${validatedBy.lastName}.`}
        />
      );
    }
  } else if (
    applicationStatus === CreditApplicationStatus.SUBMITTED &&
    !validationTs &&
    !validatedBy
  ) {
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
  } else if (applicationStatus === CreditApplicationStatus.RECOMMEND_APPROVAL) {
    const history = histories.findLast(
      (h) => h.userAction === CreditApplicationStatus.RECOMMEND_APPROVAL,
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
  } else if (applicationStatus === CreditApplicationStatus.APPROVED) {
    const history = histories.find(
      (h) => h.userAction === CreditApplicationStatus.APPROVED,
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
  const applicationData = (
    <>
      {statusBanner}
      {stats && <ApplicationSummaryCards stats={stats} />}
      <ContentCard title="Application Details">
        <ApplicationDetails
          application={creditApplication}
          userIsGov={userIsGov}
        />
      </ContentCard>
      {stats && (
        <ApplicationStatisticsGov
          stats={stats}
          validated={!!creditApplication.lastValidatedTimestamp}
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
    const caSubmittedDate = creditApplication.submissionTimestamp;
    if (!caSubmittedDate) {
      throw new Error();
    }
    const currentCy = getCurrentComplianceYear();
    const submittedCy = getComplianceYear(caSubmittedDate);
    const dominatedCys = getDominatedComplianceYears(currentCy);
    const cyOptions = [...dominatedCys, currentCy].filter(
      (cy) => cy >= ModelYear.MY_2019,
    );
    actionComponent = (
      <AnalystActions
        id={id}
        status={applicationStatus}
        complianceYears={cyOptions}
        defaultComplianceYear={submittedCy}
      />
    );
  } else if (userRoles.includes(Role.DIRECTOR)) {
    actionComponent = <DirectorActions id={id} status={applicationStatus} />;
  }

  return (
    <div className="flex flex-col gap-4">
      {applicationData}
      <CommentChat
        objectId={id}
        editable={
          userRoles.includes(Role.ZEVA_IDIR_USER) &&
          (applicationStatus === CreditApplicationStatus.SUBMITTED ||
            applicationStatus === CreditApplicationStatus.RETURNED_TO_ANALYST)
        }
        userId={userId}
        getComments={getAnalystCommentsAction}
        addComment={analystAddComment}
        editOrDeleteComment={analystEditOrDeleteComment}
      />
      {stats &&
        applicationStatus === CreditApplicationStatus.RECOMMEND_APPROVAL && (
          <RecommendationSummary stats={stats} />
        )}
      {actionComponent}
    </div>
  );
};
