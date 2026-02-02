"use client";

import { Button } from "@/app/lib/components";
import { SupplementaryReportStatus } from "@/prisma/generated/client";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { acknowledgeSupplementary } from "../actions";
import { getNormalizedComment } from "@/app/lib/utils/comment";
import { CommentBox } from "@/app/lib/components/inputs/CommentBox";

export const SupplementaryGovernmentActions = (props: {
  suppId: number;
  status: SupplementaryReportStatus;
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleAcknowledge = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        const response = await acknowledgeSupplementary(
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

  if (props.status === SupplementaryReportStatus.SUBMITTED) {
    return (
      <div className="space-y-2">
        {error && <p className="text-red-600">{error}</p>}
        <CommentBox
          comment={comment}
          setComment={setComment}
          disabled={isPending}
        />
        <Button
          variant="primary"
          onClick={handleAcknowledge}
          disabled={isPending}
        >
          {isPending ? "..." : "Acknowledge"}
        </Button>
      </div>
    );
  }
  return null;
};
