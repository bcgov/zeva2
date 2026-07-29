import { getUserInfo } from "@/auth";
import {
  CreditApplicationStatus,
  ModelYear,
  Role,
} from "@/prisma/generated/enums";
import { getCreditApplication, getApplicationStatisticsGov } from "../data";
import { ContentCard } from "@/app/lib/components";
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
import {
  getComplianceYear,
  getCurrentComplianceYear,
  getDominatedComplianceYears,
} from "@/app/lib/utils/complianceYear";
import { CommentChat } from "@/app/lib/components/CommentChat";

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
  const downloadAttachments = async () => {
    "use server";
    return getCreditApplicationAttachmentDownloadUrls(id);
  };

  const stats = await getApplicationStatisticsGov(id);
  const applicationData = (
    <>
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
      {actionComponent}
    </div>
  );
};
