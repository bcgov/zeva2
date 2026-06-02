"use client";

import { Button } from "@/app/lib/components";
import { Routes } from "@/app/lib/constants";
import { PenaltyCreditStatus } from "@/prisma/generated/enums";
import { useRouter } from "next/navigation";
import { JSX, useCallback, useState } from "react";
import { getNormalizedComment } from "@/app/lib/utils/comment";
import { Textarea } from "@/app/lib/components/inputs/Textarea";
import { Modal, ModalType } from "@/app/lib/components/Modal";
import { analystDelete, analystSubmit } from "../actions";

export const AnalystActions = (props: {
  penaltyCreditId: number;
  status: PenaltyCreditStatus;
}) => {
  const router = useRouter();
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [modal, setModal] = useState<JSX.Element | null>(null);

  const handleSubmitToDirector = useCallback(async () => {
    setError("");
    try {
      const response = await analystSubmit(
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

  const handleDelete = useCallback(async () => {
    setError("");
    try {
      const response = await analystDelete(props.penaltyCreditId);
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
  }, [props.penaltyCreditId]);

  const handleGoToEditPenaltyCredit = useCallback(() => {
    router.push(`${Routes.PenaltyCredits}/${props.penaltyCreditId}/edit`);
  }, [props.penaltyCreditId]);

  const showModal = useCallback(
    (type: "submit" | "delete") => {
      let modalType: ModalType | undefined;
      let action: (() => Promise<void>) | undefined;
      if (type === "submit") {
        modalType = "confirmation";
        action = handleSubmitToDirector;
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
    [handleSubmitToDirector, handleDelete],
  );

  if (
    props.status !== PenaltyCreditStatus.DRAFT &&
    props.status !== PenaltyCreditStatus.RETURNED_TO_ANALYST
  ) {
    return null;
  }

  return (
    <>
      <div className="mt-4">
        <p className="py-1 font-semibold text-primaryBlue">Optional Comment</p>
        <Textarea value={comment} onChange={setComment} />
      </div>
      <div className="flex flex-row gap-12 my-4">
        {error && <p className="text-red-600">{error}</p>}
        <Button variant="secondary" onClick={handleGoToEditPenaltyCredit}>
          Edit
        </Button>
        <Button variant="primary" onClick={() => showModal("submit")}>
          Submit to Director
        </Button>
        <Button variant="danger" onClick={() => showModal("delete")}>
          Delete
        </Button>
      </div>
      {modal}
    </>
  );
};
