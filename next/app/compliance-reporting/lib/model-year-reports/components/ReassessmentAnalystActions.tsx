"use client";

import { Button } from "@/app/lib/components";
import { Routes } from "@/app/lib/constants";
import { ReassessmentStatus } from "@/prisma/generated/enums";
import { useRouter } from "next/navigation";
import { JSX, useCallback, useState } from "react";
import { deleteReassessment, submitReassessment } from "../actions";
import { Textarea } from "@/app/lib/components/inputs/Textarea";
import { getNormalizedComment } from "@/app/lib/utils/comment";
import { Modal, ModalType } from "@/app/lib/components/Modal";

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
    <div className="space-y-2">
      {error && <p className="text-red-600">{error}</p>}
      <Textarea value={comment} onChange={setComment} />
      <Button onClick={() => showModal("delete")}>Delete</Button>
      <Button onClick={handleGoToEditReassessment}>Edit Reassessment</Button>
      <Button onClick={() => showModal("submit")}>Submit Reassessment</Button>
      {modal}
    </div>
  );
};
