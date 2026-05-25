"use client";

import { Button } from "@/app/lib/components";
import { ModelYearReportStatus } from "@/prisma/generated/enums";
import { useRouter } from "next/navigation";
import { JSX, useCallback, useState } from "react";
import { assessSupplementary, returnSupplementaryToAnalyst } from "../actions";
import { getNormalizedComment } from "@/app/lib/utils/comment";
import { Textarea } from "@/app/lib/components/inputs/Textarea";
import { Routes } from "@/app/lib/constants";
import { Modal, ModalType } from "@/app/lib/components/Modal";

export const SupplementaryDirectorActions = (props: {
  suppId: number;
  status: ModelYearReportStatus;
  myrId?: number;
}) => {
  const router = useRouter();
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [modal, setModal] = useState<JSX.Element | null>(null);

  const handleReturnToAnalyst = useCallback(async () => {
    setError("");
    try {
      const response = await returnSupplementaryToAnalyst(
        props.suppId,
        getNormalizedComment(comment),
      );
      if (response.responseType === "error") {
        throw new Error(response.message);
      }
      if (props.myrId) {
        router.push(`${Routes.ModelYearReports}/${props.myrId}`);
      } else {
        router.push(Routes.LegacySupplementary);
      }
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      }
    }
    setModal(null);
  }, [props.suppId, props.myrId, comment]);

  const handleAssessSupp = useCallback(async () => {
    setError("");
    try {
      const response = await assessSupplementary(
        props.suppId,
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
  }, [props.suppId, comment]);

  const showModal = useCallback(
    (type: "return" | "issue") => {
      let modalType: ModalType | undefined;
      let action: (() => Promise<void>) | undefined;
      if (type === "return") {
        modalType = "warning";
        action = handleReturnToAnalyst;
      } else if (type === "issue") {
        modalType = "confirmation";
        action = handleAssessSupp;
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
    [handleReturnToAnalyst, handleAssessSupp],
  );

  if (props.status === ModelYearReportStatus.SUBMITTED_TO_DIRECTOR) {
    return (
      <div className="space-y-2">
        <Textarea value={comment} onChange={setComment} />
        {error && <p className="text-red-600">{error}</p>}
        <Button variant="secondary" onClick={() => showModal("return")}>
          Return to Analyst
        </Button>
        <Button variant="primary" onClick={() => showModal("issue")}>
          Issue Reassessment
        </Button>
        {modal}
      </div>
    );
  }
  return null;
};
