"use client";

import { Button } from "@/app/lib/components";
import { BackButton } from "@/app/lib/components/BackButton";
import { Modal, ModalType } from "@/app/lib/components/Modal";
import { Textarea } from "@/app/lib/components/inputs/Textarea";
import { Routes } from "@/app/lib/constants";
import { getNormalizedComment } from "@/app/lib/utils/comment";
import { PenaltyCreditStatus } from "@/prisma/generated/enums";
import {
  faEdit,
  faPaperPlane,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/navigation";
import { JSX, useCallback, useState } from "react";
import { analystDelete, analystSubmit } from "../actions";

export const AnalystActions = ({
  penaltyCreditId,
  status,
}: {
  penaltyCreditId: number;
  status: PenaltyCreditStatus;
}) => {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [modal, setModal] = useState<JSX.Element | null>(null);

  const submit = useCallback(async () => {
    setError("");
    try {
      const response = await analystSubmit(
        penaltyCreditId,
        getNormalizedComment(comment),
      );
      if (response.responseType === "error") throw new Error(response.message);
      router.refresh();
    } catch (e) {
      if (e instanceof Error) setError(e.message);
    }
    setModal(null);
  }, [comment, penaltyCreditId, router]);

  const remove = useCallback(async () => {
    setError("");
    try {
      const response = await analystDelete(penaltyCreditId);
      if (response.responseType === "error") throw new Error(response.message);
      router.push(Routes.PenaltyCredits);
    } catch (e) {
      if (e instanceof Error) setError(e.message);
    }
    setModal(null);
  }, [penaltyCreditId, router]);

  const showModal = (type: "submit" | "delete") => {
    const action = type === "submit" ? submit : remove;
    const modalType: ModalType = type === "submit" ? "confirmation" : "error";
    setModal(
      <Modal
        showModal
        modalType={modalType}
        handleSubmit={action}
        handleCancel={() => setModal(null)}
      />,
    );
  };

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
      <footer className="flex min-h-20 flex-wrap items-center justify-between gap-4 bg-gray-50 px-5">
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
            onClick={() =>
              router.push(`${Routes.PenaltyCredits}/${penaltyCreditId}/edit`)
            }
          >
            Edit
          </Button>
          <Button
            variant="primary"
            icon={<FontAwesomeIcon icon={faPaperPlane} />}
            iconPosition="right"
            onClick={() => showModal("submit")}
          >
            {status === PenaltyCreditStatus.RETURNED_TO_ANALYST
              ? "Resubmit to Director"
              : "Submit to Director"}
          </Button>
        </div>
      </footer>
      {modal}
    </>
  );
};
