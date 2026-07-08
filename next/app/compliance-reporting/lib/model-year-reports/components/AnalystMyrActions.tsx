"use client";

import { Button } from "@/app/lib/components";
import { Routes } from "@/app/lib/constants";
import { ModelYearReportStatus } from "@/prisma/generated/enums";
import { useRouter } from "next/navigation";
import { JSX, useCallback, useState } from "react";
import { returnModelYearReport } from "../actions";
import { getNormalizedComment } from "@/app/lib/utils/comment";
import { Modal, ModalType } from "@/app/lib/components/Modal";
import { CommentBox } from "@/app/lib/components/CommentBox";

export const AnalystMyrActions = (props: {
  myrId: number;
  status: ModelYearReportStatus;
  assessmentExists: boolean;
}) => {
  const router = useRouter();
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [modal, setModal] = useState<JSX.Element | null>(null);

  const handleReturnToSupplier = useCallback(async () => {
    setError("");
    try {
      if (!comment) {
        throw new Error("Comment Required!");
      }
      const response = await returnModelYearReport(
        props.myrId,
        ModelYearReportStatus.RETURNED_TO_SUPPLIER,
        getNormalizedComment(comment),
      );
      if (response.responseType === "error") {
        throw new Error(response.message);
      }
      router.push(Routes.ModelYearReports);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      }
    }
    setModal(null);
  }, [props.myrId, comment]);

  const handleGoToCreateAssessment = useCallback(() => {
    router.push(`${Routes.ModelYearReports}/${props.myrId}/assessment/new`);
  }, [props.myrId]);

  const showModal = useCallback(
    (type: "return") => {
      let modalType: ModalType | undefined;
      let action: (() => Promise<void>) | undefined;
      if (type === "return") {
        modalType = "warning";
        action = handleReturnToSupplier;
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
    [handleReturnToSupplier],
  );

  if (
    props.status === ModelYearReportStatus.RETURNED_TO_ANALYST ||
    props.status === ModelYearReportStatus.SUBMITTED_TO_GOVERNMENT
  ) {
    return (
      <div className="flex flex-col gap-4">
        <CommentBox
          comment={comment}
          setComment={setComment}
          subtext="required when returning"
        />
        <div className="flex flex-row p-5 bg-lightGrey justify-between">
          <Button onClick={() => showModal("return")} variant="danger">
            Return to Supplier
          </Button>
          <div className="flex flex-row gap-4 items-center">
            {error && <span className="text-red-600">{error}</span>}
            {!props.assessmentExists && (
              <Button onClick={handleGoToCreateAssessment} variant="primary">
                Conduct Assessment
              </Button>
            )}
          </div>
        </div>
        {modal}
      </div>
    );
  }
  return null;
};
