"use client";

import { Button } from "@/app/lib/components";
import { Routes } from "@/app/lib/constants";
import { ReassessmentStatus } from "@/prisma/generated/enums";
import { useRouter } from "next/navigation";
import { JSX, useCallback, useState } from "react";
import { deleteReassessment, submitReassessment } from "../actions";
import { getNormalizedComment } from "@/app/lib/utils/comment";
import { Modal, ModalType } from "@/app/lib/components/Modal";
import { CommentBox } from "@/app/lib/components/CommentBox";

export const ReassessmentAnalystActions = (props: {
  reassessmentId: number;
  status: ReassessmentStatus;
  myrId?: number;
}) => {
  const router = useRouter();
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [modal, setModal] = useState<JSX.Element | null>(null);

  const handleGoToEditReassessment = useCallback(() => {
    if (props.myrId) {
      router.push(
        `${Routes.ModelYearReports}/${props.myrId}/reassessment/${props.reassessmentId}/edit`,
      );
    } else {
      router.push(`${Routes.LegacyReassessments}/${props.reassessmentId}/edit`);
    }
  }, [props.reassessmentId, props.myrId]);

  const handleSubmit = useCallback(async () => {
    setError("");
    try {
      const response = await submitReassessment(
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

  const handleDelete = useCallback(async () => {
    setError("");
    try {
      const response = await deleteReassessment(props.reassessmentId);
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

  const showModal = useCallback(
    (type: "submit" | "delete") => {
      let modalType: ModalType | undefined;
      let action: (() => Promise<void>) | undefined;
      if (type === "submit") {
        modalType = "confirmation";
        action = handleSubmit;
      } else if (type === "delete") {
        modalType = "error";
        action = handleDelete;
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
    [handleSubmit, handleDelete],
  );

  if (
    props.status !== ReassessmentStatus.DRAFT &&
    props.status !== ReassessmentStatus.RETURNED_TO_ANALYST
  ) {
    return null;
  }
  return (
    <div className="flex flex-col gap-4">
      <CommentBox comment={comment} setComment={setComment} />
      {error && <p className="text-red-600">{error}</p>}
      <div className="flex flex-row items-center p-5 bg-lightGrey justify-between">
        <div className="flex flex-row items-center gap-2">
          <Button onClick={() => showModal("delete")} variant="danger">
            Delete
          </Button>
          <Button onClick={handleGoToEditReassessment} variant="secondary">
            Edit Reassessment
          </Button>
        </div>
        <Button onClick={() => showModal("submit")} variant="primary">
          Submit Reassessment
        </Button>
      </div>
      {modal}
    </div>
  );
};
