"use client";

import { Button } from "@/app/lib/components";
import { ModelYearReportStatus } from "@/prisma/generated/client";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { assessModelYearReport, returnModelYearReport } from "../actions";
import { getNormalizedComment } from "@/app/credit-application/lib/utils";
import { CommentBox } from "@/app/lib/components/inputs/CommentBox";

export const DirectorActions = (props: {
  myrId: number;
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
        await returnModelYearReport(
          props.myrId,
          ModelYearReportStatus.RETURNED_TO_ANALYST,
          getNormalizedComment(comment),
        );
        router.refresh();
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, [props.myrId, props.status, comment]);

  const handleIssueAssessment = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        await assessModelYearReport(props.myrId, getNormalizedComment(comment));
        router.refresh();
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, [props.myrId, comment]);

  if (props.status !== ModelYearReportStatus.SUBMITTED_TO_DIRECTOR) {
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
        {isPending ? "..." : "Issue Assessment"}
      </Button>
    </div>
  );
};
