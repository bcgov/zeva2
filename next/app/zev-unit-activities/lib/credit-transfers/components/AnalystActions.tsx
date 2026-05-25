"use client";

import { Button } from "@/app/lib/components";
import { Textarea } from "@/app/lib/components/inputs/Textarea";
import { CreditTransferStatus } from "@/prisma/generated/enums";
import { useRouter } from "next/navigation";
import { JSX, useCallback, useState } from "react";
import { getNormalizedComment } from "@/app/lib/utils/comment";
import { govRecommendTransfer } from "../actions";
import { Modal, ModalType } from "@/app/lib/components/Modal";

export const AnalystActions = (props: {
  id: number;
  status: CreditTransferStatus;
}) => {
  const router = useRouter();
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [modal, setModal] = useState<JSX.Element | null>(null);

  const handleRecommend = useCallback(
    async (status: CreditTransferStatus) => {
      setError("");
      try {
        const response = await govRecommendTransfer(
          props.id,
          status,
          getNormalizedComment(comment),
        );
        if (response.responseType === "error") {
          throw new Error(response.message);
        }
        router.refresh();
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
    (type: "recommendApprove" | "recommendReject") => {
      let modalType: ModalType | undefined;
      let action: (() => Promise<void>) | undefined;
      if (type === "recommendApprove") {
        modalType = "confirmation";
        action = () =>
          handleRecommend(CreditTransferStatus.RECOMMEND_APPROVAL_GOV);
      } else if (type === "recommendReject") {
        modalType = "warning";
        action = () =>
          handleRecommend(CreditTransferStatus.RECOMMEND_REJECTION_GOV);
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
    [handleRecommend],
  );

  if (
    props.status !== CreditTransferStatus.APPROVED_BY_TRANSFER_TO &&
    props.status !== CreditTransferStatus.RETURNED_TO_ANALYST
  ) {
    return null;
  }
  return (
    <div className="space-y-2">
      {error && <p className="text-red-600">{error}</p>}
      <Textarea value={comment} onChange={setComment} />
      <Button variant="primary" onClick={() => showModal("recommendApprove")}>
        Recommend Approval
      </Button>
      <Button variant="secondary" onClick={() => showModal("recommendReject")}>
        Recommend Rejection
      </Button>
      {modal}
    </div>
  );
};
