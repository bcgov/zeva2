"use client";

import { Button } from "@/app/lib/components";
import { CommentBox } from "@/app/lib/components/inputs/CommentBox";
import { CreditTransferStatus } from "@/prisma/generated/client";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { getNormalizedComment } from "@/app/credit-application/lib/utils";
import { govRecommendTransfer } from "../actions";

export const AnalystActions = (props: {
  id: number;
  status: CreditTransferStatus;
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleRecommend = useCallback(
    (status: CreditTransferStatus) => {
      setError("");
      startTransition(async () => {
        try {
          const response = await govRecommendTransfer(
            props.id,
            status,
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
    },
    [props.id, comment],
  );

  if (
    props.status !== CreditTransferStatus.APPROVED_BY_TRANSFER_TO &&
    props.status !== CreditTransferStatus.RETURNED_TO_ANALYST
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
        onClick={() => {
          handleRecommend(CreditTransferStatus.RECOMMEND_APPROVAL_GOV);
        }}
        disabled={isPending}
      >
        {isPending ? "..." : "Recommend Approval"}
      </Button>
      <Button
        onClick={() => {
          handleRecommend(CreditTransferStatus.RECOMMEND_REJECTION_GOV);
        }}
        disabled={isPending}
      >
        {isPending ? "..." : "Recommend Rejection"}
      </Button>
    </div>
  );
};
