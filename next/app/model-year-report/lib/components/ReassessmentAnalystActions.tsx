"use client";

import { Button } from "@/app/lib/components";
import { Routes } from "@/app/lib/constants";
import { ReassessmentStatus } from "@/prisma/generated/client";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { deleteReassessment } from "../actions";
import { getNormalizedComment } from "@/app/lib/utils/comment";
import { CommentBox } from "@/app/lib/components/inputs/CommentBox";

export const ReassessmentAnalystActions = (props: {
  reassessmentId: number;
  status: ReassessmentStatus;
  myrId?: number;
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleGoToConductReassessment = useCallback(() => {
    if (props.myrId) {
      router.push(`${Routes.ComplianceReporting}/${props.myrId}/reassessment`);
    } else {
      router.push(`${Routes.LegacyReassessments}/new`);
    }
  }, [props.myrId]);

  const handleDelete = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        await deleteReassessment(props.reassessmentId);
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

  if (props.status !== ReassessmentStatus.RETURNED_TO_ANALYST) {
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
      <Button onClick={handleGoToConductReassessment} disabled={isPending}>
        {isPending ? "..." : "Conduct Reassessment"}
      </Button>
      <Button onClick={handleDelete} disabled={isPending}>
        {isPending ? "..." : "Delete"}
      </Button>
    </div>
  );
};
