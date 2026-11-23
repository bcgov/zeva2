"use client";

import { Button } from "@/app/lib/components";
import { CreditApplicationStatus, ModelYear } from "@/prisma/generated/enums";
import { useRouter } from "next/navigation";
import { JSX, useCallback, useState } from "react";
import {
  analystRecommend,
  analystReject,
  validateCreditApplication,
} from "../actions";
import { Routes } from "@/app/lib/constants";
import { getNormalizedComment } from "@/app/lib/utils/comment";
import { Modal, ModalType } from "@/app/lib/components/Modal";
import { CommentBox } from "@/app/lib/components/CommentBox";

export const AnalystActions = (props: {
  id: number;
  status: CreditApplicationStatus;
}) => {
  const router = useRouter();
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [modal, setModal] = useState<JSX.Element | null>(null);

  const handleValidate = useCallback(async () => {
    const response = await validateCreditApplication(props.id);
    if (response.responseType === "error") {
      setError(response.message);
    } else {
      router.push(`${Routes.CreditApplications}/${props.id}/validated`);
    }
    setModal(null);
  }, [props.id]);

  const handleRecommend = useCallback(async () => {
    try {
      const response = await analystRecommend(
        props.id,
        getNormalizedComment(comment),
      );
      if (response.responseType === "error") {
        throw new Error(response.message);
      } else {
        router.refresh();
      }
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      }
    }
    setModal(null);
  }, [props.id, comment]);

  const handleReject = useCallback(async () => {
    try {
      if (!comment) {
        throw new Error("Comment required when rejecting!");
      }
      const response = await analystReject(
        props.id,
        getNormalizedComment(comment),
      );
      if (response.responseType === "error") {
        setError(response.message);
      } else {
        router.refresh();
      }
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      }
    }
    setModal(null);
  }, [props.id, comment]);

  const showModal = useCallback(
    (type: "validate" | "recommend" | "reject") => {
      let modalType: ModalType | undefined;
      let action: (() => Promise<void>) | undefined;
      if (type === "validate") {
        modalType = "warning";
        action = handleValidate;
      } else if (type === "recommend") {
        modalType = "confirmation";
        action = handleRecommend;
      } else if (type === "reject") {
        modalType = "error";
        action = handleReject;
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
    [handleValidate, handleRecommend, handleReject],
  );

  if (
    props.status === CreditApplicationStatus.SUBMITTED ||
    props.status === CreditApplicationStatus.VALIDATED ||
    props.status === CreditApplicationStatus.RETURNED_TO_ANALYST
  ) {
    return (
      <>
        <CommentBox
          comment={comment}
          setComment={setComment}
          warningSubSentence="reject the application"
        />
        <div className="flex flex-row justify-between items-center p-5 bg-lightGrey">
          <Button variant="danger" onClick={() => showModal("reject")}>
            Reject
          </Button>
          <div className="flex flex-row items-center gap-4">
            {error && <p className="text-red-600">{error}</p>}
            <Button variant="primary" onClick={() => showModal("validate")}>
              Validate
            </Button>
            <Button
              variant="primary"
              disabled={props.status === CreditApplicationStatus.SUBMITTED}
              onClick={() => showModal("recommend")}
            >
              Recommend Approval
            </Button>
          </div>
        </div>
        {modal}
      </>
    );
  }
  return null;
};
