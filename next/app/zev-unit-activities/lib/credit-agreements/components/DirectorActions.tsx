"use client";

import { Button } from "@/app/lib/components";
import { AgreementStatus } from "@/prisma/generated/enums";
import { useRouter } from "next/navigation";
import { JSX, useCallback, useState } from "react";
import { issueAgreement, returnToAnalyst } from "../actions";
import { getNormalizedComment } from "@/app/lib/utils/comment";
import { Routes } from "@/app/lib/constants";
import { Modal, ModalType } from "@/app/lib/components/Modal";
import { BackButton } from "@/app/lib/components/BackButton";
import { CommentBox } from "@/app/lib/components/CommentBox";

export const DirectorActions = (props: {
  agreementId: number;
  status: AgreementStatus;
}) => {
  const router = useRouter();
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [modal, setModal] = useState<JSX.Element | null>(null);

  const handleReturnToAnalyst = useCallback(async () => {
    setError("");
    try {
      const response = await returnToAnalyst(
        props.agreementId,
        getNormalizedComment(comment),
      );
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
  }, [props.agreementId, comment]);

  const handleIssue = useCallback(async () => {
    setError("");
    try {
      const response = await issueAgreement(
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

  const showModal = useCallback(
    (type: "return" | "issue") => {
      let modalType: ModalType | undefined;
      let action: (() => Promise<void>) | undefined;
      if (type === "return") {
        modalType = "error";
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

  if (props.status !== AgreementStatus.RECOMMEND_APPROVAL) {
    return null;
  }

  return (
    <>
      <section className="overflow-hidden rounded border border-dividerMedium bg-white">
        <CommentBox
          comment={comment}
          setComment={setComment}
          warningSubSentence="issue the agreement"
        />
      </section>
      {error && <p className="text-red-600">{error}</p>}
      <footer className="flex min-h-20 items-center justify-between gap-4 bg-gray-50 px-5">
        <BackButton />
        <div className="flex gap-4">
          <Button variant="secondary" onClick={() => showModal("return")}>
            Return to Analyst
          </Button>
          <Button variant="primary" onClick={() => showModal("issue")}>
            Issue
          </Button>
        </div>
      </footer>
      {modal}
    </>
  );
};
