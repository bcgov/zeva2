"use client";

import { Button } from "@/app/lib/components";
import { CommentBox } from "@/app/lib/components/inputs/CommentBox";
import { CreditTransferStatus } from "@/prisma/generated/enums";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { getNormalizedComment } from "@/app/lib/utils/comment";
import {
  directorIssueTransfer,
  directorRejectTransfer,
  directorReturnTransfer,
} from "../actions";

export const DirectorActions = (props: {
  id: number;
  status: CreditTransferStatus;
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string>("");

  const directorAction = useCallback(
    (status: CreditTransferStatus) => {
      setError("");
      startTransition(async () => {
        try {
          let response;
          const normalizedComment = getNormalizedComment(comment);
          if (status === CreditTransferStatus.RETURNED_TO_ANALYST) {
            response = await directorReturnTransfer(
              props.id,
              normalizedComment,
            );
          } else if (status === CreditTransferStatus.APPROVED_BY_GOV) {
            response = await directorIssueTransfer(props.id, normalizedComment);
          } else if (status === CreditTransferStatus.REJECTED_BY_GOV) {
            response = await directorRejectTransfer(
              props.id,
              normalizedComment,
            );
          }
          if (response) {
            if (response.responseType === "error") {
              throw new Error(response.message);
            }
            router.refresh();
          }
        } catch (e) {
          if (e instanceof Error) {
            setError(e.message);
          }
        }
      });
    },
    [props.id, comment],
  );

  if (
    props.status !== CreditTransferStatus.RECOMMEND_APPROVAL_GOV &&
    props.status !== CreditTransferStatus.RECOMMEND_REJECTION_GOV
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
      <Button
        variant="secondary"
        onClick={() => {
          directorAction(CreditTransferStatus.RETURNED_TO_ANALYST);
        }}
        disabled={isPending}
      >
        {isPending ? "..." : "Return to Analyst"}
      </Button>
      {props.status === CreditTransferStatus.RECOMMEND_APPROVAL_GOV && (
        <Button
          variant="primary"
          onClick={() => {
            directorAction(CreditTransferStatus.APPROVED_BY_GOV);
          }}
          disabled={isPending}
        >
          {isPending ? "..." : "Approve"}
        </Button>
      )}
      {props.status === CreditTransferStatus.RECOMMEND_REJECTION_GOV && (
        <Button
          variant="danger"
          onClick={() => {
            directorAction(CreditTransferStatus.REJECTED_BY_GOV);
          }}
          disabled={isPending}
        >
          {isPending ? "..." : "Reject"}
        </Button>
      )}
    </div>
  );
};
