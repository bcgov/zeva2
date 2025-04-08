import { getUserInfo } from "@/auth";
import {
  govIssueTransfer,
  govRecommendTransfer,
  govRejectTransfer,
  govReturnTransfer,
  rescindTransfer,
  transferToSupplierActionTransfer,
} from "../actions";
import { getTransfer } from "../services";
import { Role, ZevUnitTransferStatuses } from "@/prisma/generated/client";
import { revalidateAndRedirect } from "@/app/lib/utils/routing";
import { Routes } from "@/app/lib/constants";
import { RedirectType } from "next/navigation";
import { transferFromSupplierRescindableStatuses } from "../constants";
import ZevUnitTransferActionsClient from "./ZevUnitTransferActionsClient";

const ZevUnitTransferActions = async (props: { id: number }) => {
  const transferId = props.id;
  const { userIsGov, userOrgId, userRoles } = await getUserInfo();
  const transfer = await getTransfer(transferId);
  const commentActionsMap: {
    [key: string]: (comment: string) => Promise<void>;
  } = {};
  const noCommentActionsMap: {
    [key: string]: () => Promise<void>;
  } = {};
  if (transfer) {
    const status = transfer.status;
    const transferFromId = transfer.transferFromId;
    const transferToId = transfer.transferToId;
    const path = `${Routes.CreditTransactions}/${transferId}`;

    if (
      userIsGov &&
      userRoles.some((role) => {
        return role === Role.ENGINEER_ANALYST;
      }) &&
      (status === ZevUnitTransferStatuses.APPROVED_BY_TRANSFER_TO ||
        status === ZevUnitTransferStatuses.RETURNED_TO_ANALYST)
    ) {
      commentActionsMap["Recommend Approval"] = async (comment: string) => {
        "use server";
        await govRecommendTransfer(
          transferId,
          ZevUnitTransferStatuses.RECOMMEND_APPROVAL_GOV,
          comment,
        );
        revalidateAndRedirect(path, RedirectType.replace);
      };
      commentActionsMap["Recommend Rejection"] = async (comment: string) => {
        "use server";
        await govRecommendTransfer(
          transferId,
          ZevUnitTransferStatuses.RECOMMEND_REJECTION_GOV,
          comment,
        );
        revalidateAndRedirect(path, RedirectType.replace);
      };
    } else if (
      userIsGov &&
      userRoles.some((role) => {
        return role === Role.DIRECTOR;
      }) &&
      (status === ZevUnitTransferStatuses.RECOMMEND_APPROVAL_GOV ||
        status === ZevUnitTransferStatuses.RECOMMEND_REJECTION_GOV)
    ) {
      commentActionsMap["Return To Analyst"] = async (comment: string) => {
        "use server";
        await govReturnTransfer(transferId, comment);
        revalidateAndRedirect(path, RedirectType.replace);
      };
      noCommentActionsMap["Approve"] = async () => {
        "use server";
        await govIssueTransfer(transferId);
        revalidateAndRedirect(path, RedirectType.replace);
      };
      commentActionsMap["Reject"] = async (comment: string) => {
        "use server";
        await govRejectTransfer(transferId, comment);
        revalidateAndRedirect(path, RedirectType.replace);
      };
    } else if (
      userOrgId === transferFromId &&
      transferFromSupplierRescindableStatuses.some((x) => {
        return x === status;
      })
    ) {
      commentActionsMap["Rescind"] = async (comment: string) => {
        "use server";
        await rescindTransfer(transferId, comment);
        revalidateAndRedirect(path, RedirectType.replace);
      };
    } else if (
      userOrgId === transferToId &&
      status === ZevUnitTransferStatuses.SUBMITTED_TO_TRANSFER_TO
    ) {
      noCommentActionsMap["Approve"] = async () => {
        "use server";
        await transferToSupplierActionTransfer(
          props.id,
          ZevUnitTransferStatuses.APPROVED_BY_TRANSFER_TO,
        );
        revalidateAndRedirect(path, RedirectType.replace);
      };
      commentActionsMap["Reject"] = async (comment: string) => {
        "use server";
        await transferToSupplierActionTransfer(
          props.id,
          ZevUnitTransferStatuses.REJECTED_BY_TRANSFER_TO,
          comment,
        );
        revalidateAndRedirect(path, RedirectType.replace);
      };
    }

    return (
      <ZevUnitTransferActionsClient
        commentActionsMap={commentActionsMap}
        noCommentActionsMap={noCommentActionsMap}
      />
    );
  }
  return null;
};

export default ZevUnitTransferActions;
