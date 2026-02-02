"use client";

import { Button } from "@/app/lib/components";
import { SupplementaryReportStatus } from "@/prisma/generated/client";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { deleteSupplementary, submitSupplementary } from "../actions";
import { getNormalizedComment } from "@/app/lib/utils/comment";
import { CommentBox } from "@/app/lib/components/inputs/CommentBox";
import { Routes } from "@/app/lib/constants";

// if myrId is defined, then we're working with a non-legacy supplementary;
// otherwise, it is a legacy supplementary
export const SupplementarySupplierActions = (props: {
  suppId: number;
  status: SupplementaryReportStatus;
  myrId?: number;
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleDelete = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        const response = await deleteSupplementary(props.suppId);
        if (response.responseType === "error") {
          throw new Error(response.message);
        }
        if (props.myrId) {
          router.push(`${Routes.ComplianceReporting}/${props.myrId}`);
        } else {
          router.push(`${Routes.LegacySupplementary}`);
        }
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, []);

  const handleSubmit = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        const response = await submitSupplementary(
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
    });
  }, [props.suppId, comment]);

  const handleGoToEdit = useCallback(() => {
    if (props.myrId) {
      router.push(
        `${Routes.ComplianceReporting}/${props.myrId}/supplementary/${props.suppId}/edit`,
      );
    } else {
      router.push(`${Routes.LegacySupplementary}/${props.suppId}/edit`);
    }
  }, [props.myrId, props.suppId]);

  if (props.status === SupplementaryReportStatus.DRAFT) {
    return (
      <div className="space-y-2">
        {error && <p className="text-red-600">{error}</p>}
        <CommentBox
          comment={comment}
          setComment={setComment}
          disabled={isPending}
        />
        <Button variant="secondary" onClick={handleDelete} disabled={isPending}>
          {isPending ? "..." : "Delete"}
        </Button>
        <Button
          variant="secondary"
          onClick={handleGoToEdit}
          disabled={isPending}
        >
          {isPending ? "..." : "Edit"}
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={isPending}>
          {isPending ? "..." : "Submit"}
        </Button>
      </div>
    );
  }
  return null;
};
