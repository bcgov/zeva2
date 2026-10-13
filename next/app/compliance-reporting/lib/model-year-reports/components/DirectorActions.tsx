"use client";

import { Button } from "@/app/lib/components";
import { ModelYearReportStatus } from "@/prisma/generated/enums";
import { useRouter } from "next/navigation";
import { JSX, useCallback, useState } from "react";
import { assessModelYearReport, returnModelYearReport } from "../actions";
import { getNormalizedComment } from "@/app/lib/utils/comment";
import { Routes } from "@/app/lib/constants";
import { Modal, ModalType } from "@/app/lib/components/Modal";
import { CommentBox } from "@/app/lib/components/CommentBox";

export const DirectorActions = (props: {
  myrId: number;
  status: ModelYearReportStatus;
}) => {
  const router = useRouter();
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [modal, setModal] = useState<JSX.Element | null>(null);

  const handleReturnToAnalyst = useCallback(async () => {
    setError("");
    try {
      const response = await returnModelYearReport(
        props.myrId,
        ModelYearReportStatus.RETURNED_TO_ANALYST,
        getNormalizedComment(comment),
      );
      if (response.responseType === "error") {
        throw new Error(response.message);
      }
      router.push(Routes.ModelYearReports);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      }
    }
    setModal(null);
  }, [props.myrId, comment]);

  const handleIssueAssessment = useCallback(async () => {
    setError("");
    try {
      const response = await assessModelYearReport(
        props.myrId,
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
  }, [props.myrId, comment]);

  const showModal = useCallback(
    (type: "return" | "issue") => {
      let modalType: ModalType | undefined;
      let action: (() => Promise<void>) | undefined;
      if (type === "return") {
        modalType = "warning";
        action = handleReturnToAnalyst;
      } else if (type === "issue") {
        modalType = "confirmation";
        action = handleIssueAssessment;
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
    [handleReturnToAnalyst, handleIssueAssessment],
  );

  if (props.status !== ModelYearReportStatus.SUBMITTED_TO_DIRECTOR) {
    return null;
  }
  return (
    <div className="flex flex-col gap-2">
      <CommentBox
        comment={comment}
        setComment={setComment}
        warningSubSentence="issue the assessment"
      />
      {error && <span className="text-red-600">{error}</span>}
      <div className="flex flex-row p-2 bg-gray-50 justify-between">
        <Button onClick={() => showModal("return")} variant="secondary">
          Return to Analyst
        </Button>
        <Button onClick={() => showModal("issue")} variant="primary">
          Issue Assessment
        </Button>
      </div>
      {modal}
    </div>
  );
};
