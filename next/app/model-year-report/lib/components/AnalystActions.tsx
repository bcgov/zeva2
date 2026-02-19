"use client";

import { Button } from "@/app/lib/components";
import { Routes } from "@/app/lib/constants";
import { ModelYearReportStatus } from "@/prisma/generated/enums";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { returnModelYearReport, submitAssessment } from "../actions";
import { getNormalizedComment } from "@/app/lib/utils/comment";
import { CommentBox } from "@/app/lib/components/inputs/CommentBox";

export const AnalystActions = (props: {
  myrId: number;
  status: ModelYearReportStatus;
  assessmentExists: boolean;
  canCreateReassessment: boolean;
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleReturnToSupplier = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        const response = await returnModelYearReport(
          props.myrId,
          ModelYearReportStatus.RETURNED_TO_SUPPLIER,
          getNormalizedComment(comment),
        );
        if (response.responseType === "error") {
          throw new Error(response.message);
        }
        router.push(Routes.ComplianceReporting);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, [props.myrId, comment]);

  const handleSubmitToDirector = useCallback(() => {
    setError("");
    startTransition(async () => {
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
    });
  }, [props.myrId, comment]);

  const handleGoToCreateAssessment = useCallback(() => {
    router.push(`${Routes.ComplianceReporting}/${props.myrId}/assessment`);
  }, [props.myrId]);

  const handleGoToEditAssessment = useCallback(() => {
    router.push(`${Routes.ComplianceReporting}/${props.myrId}/assessment/edit`);
  }, [props.myrId]);

  const handleGoToCreateReassessment = useCallback(() => {
    router.push(`${Routes.ComplianceReporting}/${props.myrId}/reassessment`);
  }, [props.myrId]);

  if (
    props.status === ModelYearReportStatus.RETURNED_TO_ANALYST ||
    props.status === ModelYearReportStatus.SUBMITTED_TO_GOVERNMENT
  ) {
    return (
      <div>
        {error && <p className="text-red-600">{error}</p>}
        <CommentBox
          comment={comment}
          setComment={setComment}
          disabled={isPending}
        />
        <Button
          variant="secondary"
          onClick={handleReturnToSupplier}
          disabled={isPending}
        >
          {isPending ? "..." : "Return To Supplier"}
        </Button>
        {props.assessmentExists ? (
          <>
            <Button
              variant="secondary"
              onClick={handleGoToEditAssessment}
              disabled={isPending}
            >
              {isPending ? "..." : "Edit Assessment"}
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmitToDirector}
              disabled={isPending}
            >
              {isPending ? "..." : "Submit to Director"}
            </Button>
          </>
        ) : (
          <Button
            variant="primary"
            onClick={handleGoToCreateAssessment}
            disabled={isPending}
          >
            {isPending ? "..." : "Create Assessment"}
          </Button>
        )}
      </div>
    );
  } else if (props.canCreateReassessment) {
    return (
      <Button
        variant="primary"
        onClick={handleGoToCreateReassessment}
        disabled={isPending}
      >
        {isPending ? "..." : "Create Reassessment"}
      </Button>
    );
  }
  return null;
};
