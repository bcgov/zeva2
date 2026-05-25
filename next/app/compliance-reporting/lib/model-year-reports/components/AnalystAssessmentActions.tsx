"use client";

import { Button } from "@/app/lib/components";
import { Routes } from "@/app/lib/constants";
import { ModelYearReportStatus } from "@/prisma/generated/enums";
import { useRouter } from "next/navigation";
import { JSX, useCallback, useState } from "react";
import { submitAssessment } from "../actions";
import { getNormalizedComment } from "@/app/lib/utils/comment";
import { Textarea } from "@/app/lib/components/inputs/Textarea";
import { Modal, ModalType } from "@/app/lib/components/Modal";

export const AnalystAssessmentActions = (props: {
  myrId: number;
  status: ModelYearReportStatus;
}) => {
  const router = useRouter();
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [modal, setModal] = useState<JSX.Element | null>(null);

  const handleSubmitToDirector = useCallback(async () => {
    setError("");
    try {
      const response = await submitAssessment(
        props.myrId,
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
  }, [props.myrId, comment]);

  const handleGoToEditAssessment = useCallback(() => {
    router.push(`${Routes.ModelYearReports}/${props.myrId}/assessment/edit`);
  }, [props.myrId]);

  const showModal = useCallback(
    (type: "submit") => {
      let modalType: ModalType | undefined;
      let action: (() => Promise<void>) | undefined;
      if (type === "submit") {
        modalType = "confirmation";
        action = handleSubmitToDirector;
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
    [handleSubmitToDirector],
  );

  if (
    props.status === ModelYearReportStatus.RETURNED_TO_ANALYST ||
    props.status === ModelYearReportStatus.SUBMITTED_TO_GOVERNMENT
  ) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex flex-col border border-dividerMedium/40">
          <div className="p-2 bg-gray-100">
            <span className="font-semibold">Comments (optional)</span>
          </div>
          <div className="p-2">
            <Textarea
              value={comment}
              onChange={setComment}
              placeholder="Comment"
            />
          </div>
        </div>
        <div className="flex flex-row p-2 bg-gray-50 justify-between">
          <Button onClick={handleGoToEditAssessment} variant="secondary">
            Start Over
          </Button>
          <div className="flex flex-row gap-1 items-center">
            {error && <span className="text-red-600">{error}</span>}
            <Button onClick={() => showModal("submit")} variant="primary">
              Submit to Director
            </Button>
          </div>
        </div>
        {modal}
      </div>
    );
  }
  return null;
};
