"use client";

import { Button } from "@/app/lib/components";
import { ReassessmentStatus } from "@/prisma/generated/enums";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { issueReassessment, returnReassessment } from "../actions";
import { getNormalizedComment } from "@/app/lib/utils/comment";
import { CommentBox } from "@/app/lib/components/inputs/CommentBox";
import { Routes } from "@/app/lib/constants";

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
        const response = await returnReassessment(
          props.reassessmentId,
          getNormalizedComment(comment),
        );
        if (response.responseType === "error") {
          throw new Error(response.message);
        }
        router.push(Routes.LegacyReassessments);
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
        const response = await issueReassessment(
          props.reassessmentId,
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
