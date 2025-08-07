import { getUserInfo } from "@/auth";
import { AgreementDetails } from "../lib/components/AgreementDetails";
import { getAgreementDetails } from "../lib/services";
import { AgreementStatus, Role } from "@/prisma/generated/client";
import { updateStatus } from "../lib/action";
import { redirect } from "next/navigation";
import { Routes } from "@/app/lib/constants/Routes";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const [
    { id },
    { userIsGov, userRoles }
  ] = await Promise.all([props.params, getUserInfo()]);
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

  const status = agreement.status;
  
  const handleStatusChange = async (newStatus: AgreementStatus) => {
    "use server";
    if (await updateStatus(agreementId, newStatus)) {
      redirect(Routes.CreditAgreements);
    } else {
      redirect(`${Routes.CreditAgreements}/error`);
    }
  }

  return (
    <div className="p-6">
      <AgreementDetails
        agreement={agreement}
        userIsGov={userIsGov}
        editButton={
          userRoles.includes(Role.ENGINEER_ANALYST) && (
            status === AgreementStatus.DRAFT ||
            status === AgreementStatus.RETURNED_TO_ANALYST
          )
        }
        handleRecommendApproval={
          userRoles.includes(Role.ENGINEER_ANALYST) && (
            status === AgreementStatus.DRAFT ||
            status === AgreementStatus.RETURNED_TO_ANALYST
          )
            ? async () => {
              "use server";
              await handleStatusChange(AgreementStatus.RECOMMEND_APPROVAL);
            }
            : undefined
        }
        handleReturnToAnalyst={
          userRoles.includes(Role.DIRECTOR) && status === AgreementStatus.RECOMMEND_APPROVAL
            ? async () => {
              "use server";
              await handleStatusChange(AgreementStatus.RETURNED_TO_ANALYST);
            }
            : undefined
        }
        handleDeleteAgreement={
          userRoles.includes(Role.ENGINEER_ANALYST)
            ? async () => {
              "use server";
              await handleStatusChange(AgreementStatus.DELETED);
            }
            : undefined
        }
        handleIssueAgreement={
          userRoles.includes(Role.DIRECTOR) && status === AgreementStatus.RECOMMEND_APPROVAL
            ? async () => {
              "use server";
              await handleStatusChange(AgreementStatus.ISSUED);
            }
            : undefined
        }
      />
    </div>
  );
};

export default Page;
