"use client";

import { Button } from "@/app/lib/components";
import { Routes } from "@/app/lib/constants";
import { ReassessmentStatus } from "@/prisma/generated/client";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { deleteReassessment, submitReassessment } from "../actions";
import { CommentBox } from "@/app/lib/components/inputs/CommentBox";
import { getNormalizedComment } from "@/app/lib/utils/comment";

export const ReassessmentAnalystActions = (props: {
  reassessmentId: number;
  status: ReassessmentStatus;
  myrId?: number;
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleGoToEditReassessment = useCallback(() => {
    if (props.myrId) {
      router.push(
        `${Routes.ComplianceReporting}/${props.myrId}/reassessment/${props.reassessmentId}/edit`,
      );
    } else {
      router.push(`${Routes.LegacyReassessments}/${props.reassessmentId}/edit`);
    }
  }, [props.reassessmentId, props.myrId]);

  const handleSubmit = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        const response = await submitReassessment(
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

  const handleDelete = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        const response = await deleteReassessment(props.reassessmentId);
        if (response.responseType === "error") {
          throw new Error(response.message);
        }
        if (props.myrId) {
          router.push(`${Routes.ComplianceReporting}/${props.myrId}`);
        } else {
          router.push(Routes.LegacyReassessments);
        }
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, [props.reassessmentId, props.myrId, comment]);

  if (
    props.status !== ReassessmentStatus.DRAFT &&
    props.status !== ReassessmentStatus.RETURNED_TO_ANALYST
  ) {
    return null;
  }
  return (
    <div className="space-y-2">
      {error && <p className="text-red-600">{error}</p>}
      <CommentBox
        comment={comment}
        setComment={setComment}
        disabled={isPending}
      />
      <Button onClick={handleDelete} disabled={isPending}>
        {isPending ? "..." : "Delete"}
      </Button>
      <Button onClick={handleGoToEditReassessment} disabled={isPending}>
        {isPending ? "..." : "Edit Reassessment"}
      </Button>
      <Button onClick={handleSubmit} disabled={isPending}>
        {isPending ? "..." : "Submit Reassessment"}
      </Button>
    </div>
  );
};
