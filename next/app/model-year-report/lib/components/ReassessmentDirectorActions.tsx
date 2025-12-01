"use client";

import { Button } from "@/app/lib/components";
import {
  ModelYearReportStatus,
  ReassessmentStatus,
} from "@/prisma/generated/client";
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

export const ReassessmentDirectorActions = (props: {
  reassessmentId: number;
  status: ReassessmentStatus;
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleReturnToAnalyst = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        await returnReassessment(
          props.reassessmentId,
          getNormalizedComment(comment),
        );
        router.refresh();
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, [props.reassessmentId, comment]);

  const handleIssueReassessment = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        await issueReassessment(
          props.reassessmentId,
          getNormalizedComment(comment),
        );
        router.refresh();
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, [props.reassessmentId, comment]);

  if (props.status !== ReassessmentStatus.SUBMITTED_TO_DIRECTOR) {
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
      <Button onClick={handleReturnToAnalyst} disabled={isPending}>
        {isPending ? "..." : "Return To Analyst"}
      </Button>
      <Button onClick={handleIssueReassessment} disabled={isPending}>
        {isPending ? "..." : "Issue Reassessment"}
      </Button>
    </div>
  );
};
