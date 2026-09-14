"use client";

import { Button } from "@/app/lib/components";
import { BackButton } from "@/app/lib/components/BackButton";
import { Modal, ModalType } from "@/app/lib/components/Modal";
import { Textarea } from "@/app/lib/components/inputs/Textarea";
import { Routes } from "@/app/lib/constants";
import { getNormalizedComment } from "@/app/lib/utils/comment";
import { PenaltyCreditStatus } from "@/prisma/generated/enums";
import { useRouter } from "next/navigation";
import { JSX, useCallback, useState } from "react";
import { directorApprove, directorReturn } from "../actions";

export const DirectorActions = ({
  penaltyCreditId,
}: {
  penaltyCreditId: number;
  status: PenaltyCreditStatus;
}) => {
  const router = useRouter();
  const [error, setError] = useState("");
  const [comment, setComment] = useState("");
  const [modal, setModal] = useState<JSX.Element | null>(null);

  const runAction = useCallback(
    async (type: "return" | "approve") => {
      setError("");
      try {
        const response =
          type === "return"
            ? await directorReturn(
                penaltyCreditId,
                getNormalizedComment(comment),
              )
            : await directorApprove(
                penaltyCreditId,
                getNormalizedComment(comment),
              );
        if (response.responseType === "error")
          throw new Error(response.message);
        if (type === "return") router.push(Routes.PenaltyCredits);
        else router.refresh();
      } catch (e) {
        if (e instanceof Error) setError(e.message);
      }
      setModal(null);
    },
    [comment, penaltyCreditId, router],
  );

  const showModal = (type: "return" | "approve") => {
    const modalType: ModalType = type === "return" ? "warning" : "confirmation";
    setModal(
      <Modal
        showModal
        modalType={modalType}
        handleSubmit={() => runAction(type)}
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
        <BackButton />
        <div className="flex gap-4">
          <Button variant="secondary" onClick={() => showModal("return")}>
            Return to Analyst
          </Button>
          <Button variant="primary" onClick={() => showModal("approve")}>
            Approve
          </Button>
        </div>
      </footer>
      {modal}
    </>
  );
};
