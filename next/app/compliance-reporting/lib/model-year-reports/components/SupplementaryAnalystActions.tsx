"use client";

import { Button } from "@/app/lib/components";
import { useRouter } from "next/navigation";
import { JSX, useCallback, useState } from "react";
import { getNormalizedComment } from "@/app/lib/utils/comment";
import { ModelYearReportStatus } from "@/prisma/generated/enums";
import { Routes } from "@/app/lib/constants";
import {
  returnSupplementaryToSupplier,
  submitSupplementaryToDirector,
} from "../actions";
import { Modal, ModalType } from "@/app/lib/components/Modal";
import { CommentBox } from "@/app/lib/components/CommentBox";

// if myrId is undefined, then we're dealing with a legacy supplementary;
// otherwise, we're dealing with a non-legacy supplementary
export const SupplementaryAnalystActions = (props: {
  suppId: number;
  status: ModelYearReportStatus;
  suppReassessmentExists: boolean;
  myrId?: number;
}) => {
  const router = useRouter();
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [modal, setModal] = useState<JSX.Element | null>(null);

  const handleReturnToSupplier = useCallback(async () => {
    setError("");
    try {
      const response = await returnSupplementaryToSupplier(
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

  const handleSubmitToDirector = useCallback(async () => {
    setError("");
    try {
      const response = await submitSupplementaryToDirector(
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

  const handleGoToCreateSuppReassessment = useCallback(() => {
    if (props.myrId) {
      router.push(
        `${Routes.ModelYearReports}/${props.myrId}/supplementary/${props.suppId}/reassessment`,
      );
    } else {
      router.push(`${Routes.LegacySupplementary}/${props.suppId}/reassessment`);
    }
  }, [props.myrId, props.suppId]);

  const handleGoToEditSuppReassessment = useCallback(() => {
    if (props.myrId) {
      router.push(
        `${Routes.ModelYearReports}/${props.myrId}/supplementary/${props.suppId}/reassessment/edit`,
      );
    } else {
      router.push(
        `${Routes.LegacySupplementary}/${props.suppId}/reassessment/edit`,
      );
    }
  }, [props.myrId, props.suppId]);

  const showModal = useCallback(
    (type: "return" | "submit") => {
      let modalType: ModalType | undefined;
      let action: (() => Promise<void>) | undefined;
      if (type === "return") {
        modalType = "warning";
        action = handleReturnToSupplier;
      } else if (type === "submit") {
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
    [handleReturnToSupplier, handleSubmitToDirector],
  );

  if (
    props.status === ModelYearReportStatus.SUBMITTED_TO_GOVERNMENT ||
    props.status === ModelYearReportStatus.RETURNED_TO_ANALYST
  ) {
    return (
      <div className="flex flex-col gap-4">
        <CommentBox
          comment={comment}
          setComment={setComment}
          warningSubSentence="return the report"
        />
        {error && <p className="text-red-600">{error}</p>}
        {props.suppReassessmentExists ? (
          <div className="flex flex-row items-center p-5 bg-lightGrey justify-between">
            <div className="flex flex-row items-center gap-2">
              <Button onClick={() => showModal("return")} variant="danger">
                Return to Supplier
              </Button>
              <Button
                variant="secondary"
                onClick={handleGoToEditSuppReassessment}
              >
                Edit Associated Reassessment
              </Button>
            </div>
            <Button variant="primary" onClick={() => showModal("submit")}>
              Submit to Director
            </Button>
          </div>
        ) : (
          <div className="flex flex-row items-center p-5 bg-lightGrey justify-between">
            <Button onClick={() => showModal("return")} variant="danger">
              Return to Supplier
            </Button>
            <Button
              variant="primary"
              onClick={handleGoToCreateSuppReassessment}
            >
              Create Associated Reassessment
            </Button>
          </div>
        )}
        {modal}
      </div>
    );
  }
  return null;
};
