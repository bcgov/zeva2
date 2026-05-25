"use client";

import { Button } from "@/app/lib/components";
import { CreditApplicationStatus } from "@/prisma/generated/enums";
import { useRouter } from "next/navigation";
import { JSX, useCallback, useState } from "react";
import { directorApprove, directorReturnToAnalyst } from "../actions";
import { getNormalizedComment } from "@/app/lib/utils/comment";
import { Routes } from "@/app/lib/constants";
import { Textarea } from "@/app/lib/components/inputs/Textarea";
import { Modal, ModalType } from "@/app/lib/components/Modal";

export const DirectorActions = (props: {
  id: number;
  status: CreditApplicationStatus;
}) => {
  const router = useRouter();
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [modal, setModal] = useState<JSX.Element | null>(null);

  const handleViewValidated = useCallback(() => {
    router.push(
      `${Routes.CreditApplications}/${props.id}/validated?readOnly=Y`,
    );
  }, [props.id, router]);

  const handleReturn = useCallback(async () => {
    const response = await directorReturnToAnalyst(
      props.id,
      getNormalizedComment(comment),
    );
    if (response.responseType === "error") {
      setError(response.message);
    } else {
      router.push(Routes.CreditApplications);
    }
  }, [props.id, comment]);

  const handleApprove = useCallback(async () => {
    const response = await directorApprove(
      props.id,
      getNormalizedComment(comment),
    );
    if (response.responseType === "error") {
      setError(response.message);
    } else {
      router.refresh();
    }
  }, [props.id, comment]);

  const showModal = useCallback(
    (type: "return" | "approve") => {
      let modalType: ModalType | undefined;
      let action: (() => Promise<void>) | undefined;
      if (type === "return") {
        modalType = "error";
        action = handleReturn;
      } else if (type === "approve") {
        modalType = "confirmation";
        action = handleApprove;
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
    [handleReturn, handleApprove],
  );

  return (
    <>
      {(props.status === CreditApplicationStatus.RECOMMEND_APPROVAL ||
        props.status === CreditApplicationStatus.APPROVED) && (
        <Button variant="secondary" onClick={handleViewValidated}>
          View Validated Records
        </Button>
      )}
      {props.status === CreditApplicationStatus.RECOMMEND_APPROVAL && (
        <>
          {error && <p className="text-red-600">{error}</p>}
          <Textarea value={comment} onChange={setComment} />
          <Button variant="primary" onClick={() => showModal("approve")}>
            Approve
          </Button>
          <Button variant="secondary" onClick={() => showModal("return")}>
            Return to Analyst
          </Button>
          {modal}
        </>
      )}
    </>
  );
};
