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
import { BackButton } from "@/app/lib/components/BackButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faPaperPlane,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";

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
      <section className="overflow-hidden rounded border border-dividerMedium bg-white">
        <h2 className="bg-disabledSurface px-5 py-4 text-xl font-bold">
          Comment (optional)
        </h2>
        <div className="max-w-3xl p-5">
          <Textarea value={comment} onChange={setComment} />
        </div>
      </section>
      {error && <p className="text-red-600">{error}</p>}
      <footer className="flex min-h-20 items-center justify-between gap-4 bg-gray-50 px-5">
        <div className="flex gap-5">
          <BackButton />
          <Button
            variant="danger"
            icon={<FontAwesomeIcon icon={faTrash} />}
            iconPosition="right"
            onClick={() => showModal("delete")}
          >
            Delete
          </Button>
        </div>
        <div className="flex gap-4">
          <Button
            variant="secondary"
            icon={<FontAwesomeIcon icon={faEdit} />}
            onClick={handleGoToEditAgreement}
          >
            Edit
          </Button>
          <Button
            variant="primary"
            icon={<FontAwesomeIcon icon={faPaperPlane} />}
            iconPosition="right"
            onClick={() => showModal("recommend")}
          >
            {props.status === AgreementStatus.RETURNED_TO_ANALYST
              ? "Resubmit to Director"
              : "Submit to Director"}
          </Button>
        </div>
      </footer>
      {modal}
    </>
  );
};
