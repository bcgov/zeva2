"use client";

import { Button } from "@/app/lib/components";
import { ReassessmentStatus } from "@/prisma/generated/enums";
import { useRouter } from "next/navigation";
import { JSX, useCallback, useState } from "react";
import { issueReassessment, returnReassessment } from "../actions";
import { getNormalizedComment } from "@/app/lib/utils/comment";
import { Routes } from "@/app/lib/constants";
import { Modal, ModalType } from "@/app/lib/components/Modal";
import { CommentBox } from "@/app/lib/components/CommentBox";

export const ReassessmentDirectorActions = (props: {
  reassessmentId: number;
  status: ReassessmentStatus;
  myrId?: number;
}) => {
  const router = useRouter();
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [modal, setModal] = useState<JSX.Element | null>(null);

  const handleReturnToAnalyst = useCallback(async () => {
    try {
      const response = await returnReassessment(
        props.reassessmentId,
        getNormalizedComment(comment),
      );
      if (response.responseType === "error") {
        throw new Error(response.message);
      }
      if (props.myrId) {
        router.push(`${Routes.ModelYearReports}/${props.myrId}`);
      } else {
        router.push(Routes.LegacyReassessments);
      }
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      }
    }
    setModal(null);
  }, [props.reassessmentId, props.myrId, comment]);

  const handleIssueReassessment = useCallback(async () => {
    setError("");
    try {
      const response = await issueReassessment(
        props.reassessmentId,
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
  }, [props.reassessmentId, comment]);

  const showModal = useCallback(
    (type: "return" | "issue") => {
      let modalType: ModalType | undefined;
      let action: (() => Promise<void>) | undefined;
      if (type === "return") {
        modalType = "warning";
        action = handleReturnToAnalyst;
      } else if (type === "issue") {
        modalType = "confirmation";
        action = handleIssueReassessment;
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
    [handleReturnToAnalyst, handleIssueReassessment],
  );

  if (props.status !== ReassessmentStatus.SUBMITTED_TO_DIRECTOR) {
    return null;
  }
  return (
    <div className="flex flex-col gap-4">
      <CommentBox
        comment={comment}
        setComment={setComment}
        warningSubSentence="issue the reassessment"
      />
      {error && <p className="text-red-600">{error}</p>}
      <div className="flex flex-row items-center p-5 bg-lightGrey justify-between">
        <Button onClick={() => showModal("return")} variant="secondary">
          Return to Analyst
        </Button>
        <Button onClick={() => showModal("issue")} variant="primary">
          Issue Reassessment
        </Button>
      </div>
      {modal}
    </div>
  );
};
