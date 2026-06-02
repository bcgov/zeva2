"use client";

import { Button } from "@/app/lib/components";
import { PenaltyCreditStatus } from "@/prisma/generated/enums";
import { JSX, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { directorApprove, directorReturn } from "../actions";
import { getNormalizedComment } from "@/app/lib/utils/comment";
import { Routes } from "@/app/lib/constants";
import { Modal, ModalType } from "@/app/lib/components/Modal";

export const DirectorActions = (props: {
  penaltyCreditId: number;
  status: PenaltyCreditStatus;
}) => {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [comment, setComment] = useState<string>("");
  const [modal, setModal] = useState<JSX.Element | null>(null);

  const handleCommentChange = useCallback((c: string) => {
    setComment(c);
  }, []);

  const handleReturnToAnalyst = useCallback(async () => {
    setError("");
    try {
      const response = await directorReturn(
        props.penaltyCreditId,
        getNormalizedComment(comment),
      );
      if (response.responseType === "error") {
        throw new Error(response.message);
      }
      router.push(Routes.PenaltyCredits);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      }
    }
    setModal(null);
  }, [props.penaltyCreditId, comment]);

  const handleIssue = useCallback(async () => {
    setError("");
    try {
      const response = await directorApprove(
        props.penaltyCreditId,
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
  }, [props.penaltyCreditId, comment]);

  const showModal = useCallback(
    (type: "return" | "issue") => {
      let modalType: ModalType | undefined;
      let action: (() => Promise<void>) | undefined;
      if (type === "return") {
        modalType = "warning";
        action = handleReturnToAnalyst;
      } else if (type === "issue") {
        modalType = "confirmation";
        action = handleIssue;
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
    [handleReturnToAnalyst, handleIssue],
  );

  if (props.status === PenaltyCreditStatus.SUBMITTED_TO_DIRECTOR) {
    return (
      <div>
        {error && <p className="text-red-600">{error}</p>}
        <input
          type="text"
          placeholder="Comment (optional)"
          value={comment}
          className="border p-2 w-full"
          onChange={(e) => {
            handleCommentChange(e.target.value);
          }}
        />
        <Button variant="secondary" onClick={() => showModal("return")}>
          Return to Analyst
        </Button>
        <Button variant="primary" onClick={() => showModal("issue")}>
          Approve
        </Button>
        {modal}
      </div>
    );
  }
  return null;
};
