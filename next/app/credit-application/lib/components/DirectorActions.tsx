"use client";

import { Button } from "@/app/lib/components";
import { CreditApplicationStatus } from "@/prisma/generated/client";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { directorApprove, directorReturnToAnalyst } from "../actions";
import { getNormalizedComment } from "@/app/lib/utils/comment";
import { Routes } from "@/app/lib/constants";
import { CommentBox } from "@/app/lib/components/inputs/CommentBox";

export const DirectorActions = (props: {
  id: number;
  status: CreditApplicationStatus;
}) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleViewValidated = useCallback(() => {
    startTransition(() => {
      router.push(
        `${Routes.CreditApplication}/${props.id}/validated?readOnly=Y`,
      );
    });
  }, [props.id, router]);

  const handleReturn = useCallback(() => {
    startTransition(async () => {
      const response = await directorReturnToAnalyst(
        props.id,
        getNormalizedComment(comment),
      );
      if (response.responseType === "error") {
        setError(response.message);
      } else {
        router.refresh();
      }
    });
  }, [props.id, comment]);

  const handleApprove = useCallback(() => {
    startTransition(async () => {
      const response = await directorApprove(
        props.id,
        getNormalizedComment(comment),
      );
      if (response.responseType === "error") {
        setError(response.message);
      } else {
        router.refresh();
      }
    });
  }, [props.id, comment]);

  return (
    <>
      {(props.status === CreditApplicationStatus.RECOMMEND_APPROVAL ||
        props.status === CreditApplicationStatus.APPROVED) && (
        <Button
          variant="secondary"
          onClick={handleViewValidated}
          disabled={isPending}
        >
          {isPending ? "..." : "View Validated Records"}
        </Button>
      )}
      {props.status === CreditApplicationStatus.RECOMMEND_APPROVAL && (
        <>
          {error && <p className="text-red-600">{error}</p>}
          <CommentBox
            comment={comment}
            setComment={setComment}
            disabled={isPending}
          />
          <Button
            variant="primary"
            onClick={handleApprove}
            disabled={isPending}
          >
            {isPending ? "..." : "Approve"}
          </Button>
          <Button
            variant="secondary"
            onClick={handleReturn}
            disabled={isPending}
          >
            {isPending ? "..." : "Return to Analyst"}
          </Button>
        </>
      )}
    </>
  );
};
