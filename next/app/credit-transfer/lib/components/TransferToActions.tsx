"use client";

import { Button } from "@/app/lib/components";
import { CommentBox } from "@/app/lib/components/inputs/CommentBox";
import { CreditTransferStatus } from "@/prisma/generated/client";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { transferToSupplierActionTransfer } from "../actions";
import { getNormalizedComment } from "@/app/credit-application/lib/utils";

export const TransferToActions = (props: {
  id: number;
  status: CreditTransferStatus;
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleApproveOrReject = useCallback(
    (status: CreditTransferStatus) => {
      setError("");
      startTransition(async () => {
        try {
          const response = await transferToSupplierActionTransfer(
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

  if (props.status !== CreditTransferStatus.SUBMITTED_TO_TRANSFER_TO) {
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
          handleApproveOrReject(CreditTransferStatus.APPROVED_BY_TRANSFER_TO);
        }}
        disabled={isPending}
      >
        {isPending ? "..." : "Approve"}
      </Button>
      <Button
        onClick={() => {
          handleApproveOrReject(CreditTransferStatus.REJECTED_BY_TRANSFER_TO);
        }}
        disabled={isPending}
      >
        {isPending ? "..." : "Reject"}
      </Button>
    </div>
  );
};
