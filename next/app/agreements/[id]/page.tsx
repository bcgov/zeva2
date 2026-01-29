import { getUserInfo } from "@/auth";
import { AgreementDetails } from "../lib/components/AgreementDetails";
import { getAgreementDetails } from "../lib/services";
import { AgreementStatus, Role } from "@/prisma/generated/client";
import { addComment, updateStatus } from "../lib/action";
import { redirect } from "next/navigation";
import { Routes } from "@/app/lib/constants/Routes";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const [{ id }, { userRoles }] = await Promise.all([
    props.params,
    getUserInfo(),
  ]);
  const agreementId = parseInt(id);
  const agreement = isNaN(agreementId)
    ? null
    : await getAgreementDetails(agreementId);
  if (!agreement) {
    return (
      <div className="p-6 font-semibold">
        Invalid agreement ID or you do not have access to it.
      </div>
    );
  }

  const forAnalyst =
    userRoles.includes(Role.ZEVA_IDIR_USER) &&
    (agreement.status === AgreementStatus.DRAFT ||
      agreement.status === AgreementStatus.RETURNED_TO_ANALYST);

  const forDirector =
    userRoles.includes(Role.DIRECTOR) &&
    agreement.status === AgreementStatus.RECOMMEND_APPROVAL;

  const handleStatusChange = (newStatus: AgreementStatus, enabled: boolean) => {
    if (enabled) {
      return async () => {
        "use server";
        if (await updateStatus(agreementId, newStatus)) {
          redirect(Routes.CreditAgreements);
        } else {
          redirect(`${Routes.CreditAgreements}/error`);
        }
      };
    }
    return undefined;
  };

  const handleAddComment = async (comment: string) => {
    "use server";
    return await addComment(agreementId, comment);
  };

  return (
    <div className="p-6">
      <AgreementDetails
        agreement={agreement}
        backLink={Routes.CreditAgreements}
        editLink={
          forAnalyst ? `${Routes.CreditAgreements}/${id}/edit` : undefined
        }
        handleRecommendApproval={handleStatusChange(
          AgreementStatus.RECOMMEND_APPROVAL,
          forAnalyst,
        )}
        handleReturnToAnalyst={handleStatusChange(
          AgreementStatus.RETURNED_TO_ANALYST,
          forDirector,
        )}
        handleIssueAgreement={handleStatusChange(
          AgreementStatus.ISSUED,
          forDirector,
        )}
        handleDeleteAgreement={handleStatusChange(
          AgreementStatus.DELETED,
          forAnalyst,
        )}
        handleAddComment={handleAddComment}
      />
    </div>
  );
};

export default Page;
