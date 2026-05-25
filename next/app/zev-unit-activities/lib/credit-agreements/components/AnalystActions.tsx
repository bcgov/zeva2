"use client";

import { Button } from "@/app/lib/components";
import { Routes } from "@/app/lib/constants";
import { AgreementStatus } from "@/prisma/generated/enums";
import { useRouter } from "next/navigation";
import { JSX, useCallback, useState } from "react";
import { deleteAgreement, recommendApproval } from "../actions";
import { getNormalizedComment } from "@/app/lib/utils/comment";
import { Textarea } from "@/app/lib/components/inputs/Textarea";
import { Modal, ModalType } from "@/app/lib/components/Modal";

export const AnalystActions = (props: {
  agreementId: number;
  status: AgreementStatus;
}) => {
  const router = useRouter();
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [modal, setModal] = useState<JSX.Element | null>(null);

  const handleRecommend = useCallback(async () => {
    setError("");
    try {
      const response = await recommendApproval(
        props.agreementId,
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
  }, [props.agreementId, comment]);

  const handleDelete = useCallback(async () => {
    setError("");
    try {
      const response = await deleteAgreement(props.agreementId);
      if (response.responseType === "error") {
        throw new Error(response.message);
      }
      router.push(Routes.CreditAgreements);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      }
    }
    setModal(null);
  }, [props.agreementId]);

  const handleGoToEditAgreement = useCallback(() => {
    router.push(`${Routes.CreditAgreements}/${props.agreementId}/edit`);
  }, [props.agreementId]);

  const showModal = useCallback(
    (type: "recommend" | "delete") => {
      let modalType: ModalType | undefined;
      let action: (() => Promise<void>) | undefined;
      if (type === "recommend") {
        modalType = "confirmation";
        action = handleRecommend;
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
    [handleRecommend, handleDelete],
  );

  if (
    props.status !== AgreementStatus.DRAFT &&
    props.status !== AgreementStatus.RETURNED_TO_ANALYST
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
        <Button variant="secondary" onClick={handleGoToEditAgreement}>
          Edit
        </Button>
        <Button variant="primary" onClick={() => showModal("recommend")}>
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
