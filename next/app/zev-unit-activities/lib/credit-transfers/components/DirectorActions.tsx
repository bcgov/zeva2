"use client";

import { Button } from "@/app/lib/components";
import { Textarea } from "@/app/lib/components/inputs/Textarea";
import { CreditTransferStatus } from "@/prisma/generated/enums";
import { useRouter } from "next/navigation";
import { JSX, useCallback, useState } from "react";
import { getNormalizedComment } from "@/app/lib/utils/comment";
import {
  directorIssueTransfer,
  directorRejectTransfer,
  directorReturnTransfer,
} from "../actions";
import { Modal, ModalType } from "@/app/lib/components/Modal";

export const DirectorActions = (props: {
  id: number;
  status: CreditTransferStatus;
}) => {
  const router = useRouter();
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [modal, setModal] = useState<JSX.Element | null>(null);

  const directorAction = useCallback(
    async (status: CreditTransferStatus) => {
      setError("");
      try {
        let response;
        const normalizedComment = getNormalizedComment(comment);
        if (status === CreditTransferStatus.RETURNED_TO_ANALYST) {
          response = await directorReturnTransfer(props.id, normalizedComment);
        } else if (status === CreditTransferStatus.APPROVED_BY_GOV) {
          response = await directorIssueTransfer(props.id, normalizedComment);
        } else if (status === CreditTransferStatus.REJECTED_BY_GOV) {
          response = await directorRejectTransfer(props.id, normalizedComment);
        }
        if (response) {
          if (response.responseType === "error") {
            throw new Error(response.message);
          }
          router.refresh();
        }
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
      setModal(null);
    },
    [props.id, comment],
  );

  const showModal = useCallback(
    (type: "return" | "approve" | "reject") => {
      let modalType: ModalType | undefined;
      let action: (() => Promise<void>) | undefined;
      if (type === "return") {
        modalType = "warning";
        action = () => directorAction(CreditTransferStatus.RETURNED_TO_ANALYST);
      } else if (type === "approve") {
        modalType = "confirmation";
        action = () => directorAction(CreditTransferStatus.APPROVED_BY_GOV);
      } else if (type === "reject") {
        modalType = "error";
        action = () => directorAction(CreditTransferStatus.REJECTED_BY_GOV);
      }
      if (modalType && action) {
        setModal(
          <Modal
            showModal={true}
            modalType={modalType}
            handleSubmit={action}
            handleCancel={() => setModal(null)}
          />,
        );
      }
    },
    [directorAction],
  );

  if (
    props.status !== CreditTransferStatus.RECOMMEND_APPROVAL_GOV &&
    props.status !== CreditTransferStatus.RECOMMEND_REJECTION_GOV
  ) {
    return null;
  }
  return (
    <div className="space-y-2">
      {error && <p className="text-red-600">{error}</p>}
      <Textarea value={comment} onChange={setComment} />
      <Button variant="secondary" onClick={() => showModal("return")}>
        Return to Analyst
      </Button>
      {props.status === CreditTransferStatus.RECOMMEND_APPROVAL_GOV && (
        <Button variant="primary" onClick={() => showModal("approve")}>
          Approve
        </Button>
      )}
      {props.status === CreditTransferStatus.RECOMMEND_REJECTION_GOV && (
        <Button variant="danger" onClick={() => showModal("reject")}>
          Reject
        </Button>
      )}
      {modal}
    </div>
  );
};
