"use client";

import { Button } from "@/app/lib/components";
import { ModelYear, ModelYearReportStatus } from "@/prisma/generated/client";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import {
  assessModelYearReport,
  issueReassessment,
  returnModelYearReport,
  returnReassessment,
} from "../actions";
import { getNormalizedComment } from "@/app/credit-application/lib/utils";
import { CommentBox } from "@/app/lib/components/inputs/CommentBox";

export const DirectorActions = (props: {
  myrId: number;
  assessableReassessmentId: number | null;
  status: ModelYearReportStatus;
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleReturnToAnalyst = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        if (props.assessableReassessmentId === null) {
          await returnModelYearReport(
            props.myrId,
            ModelYearReportStatus.RETURNED_TO_ANALYST,
            getNormalizedComment(comment),
          );
        } else {
          await returnReassessment(
            props.assessableReassessmentId,
            getNormalizedComment(comment),
          );
        }
        router.refresh();
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, [props.myrId, props.status, props.assessableReassessmentId, comment]);

  const handleIssueAssessment = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        if (props.assessableReassessmentId === null) {
          await assessModelYearReport(
            props.myrId,
            getNormalizedComment(comment),
          );
        } else {
          issueReassessment(
            props.assessableReassessmentId,
            getNormalizedComment(comment),
          );
        }
        router.refresh();
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, [props.myrId, comment]);

  if (
    props.status !== ModelYearReportStatus.SUBMITTED_TO_DIRECTOR &&
    props.assessableReassessmentId === null
  ) {
    return null;
  }
  return (
    <div className="space-y-2">
      <CommentBox
        comment={comment}
        setComment={setComment}
        disabled={isPending}
      />
      {error && <p className="text-red-600">{error}</p>}
      <Button variant="secondary" onClick={handleReturnToAnalyst} disabled={isPending}>
        {isPending ? "..." : "Return To Analyst"}
      </Button>
      <Button variant="primary" onClick={handleIssueAssessment} disabled={isPending}>
        {isPending
          ? "..."
          : `Issue ${props.assessableReassessmentId === null ? "A" : "Rea"}ssessment`}
      </Button>
    </div>
  );
};
