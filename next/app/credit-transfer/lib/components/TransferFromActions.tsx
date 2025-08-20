"use client";

import { Button } from "@/app/lib/components";
import { CommentBox } from "@/app/lib/components/inputs/CommentBox";
import { CreditTransferStatus } from "@/prisma/generated/client";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { rescindTransfer } from "../actions";
import { transferFromSupplierRescindableStatuses } from "../constants";
import { getNormalizedComment } from "@/app/credit-application/lib/utils";

export const TransferFromActions = (props: {
  id: number;
  status: CreditTransferStatus;
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleRescind = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        const response = await rescindTransfer(
          props.id,
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
  }, [props.id, comment]);

  if (!transferFromSupplierRescindableStatuses.includes(props.status)) {
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
      <Button onClick={handleRescind} disabled={isPending}>
        {isPending ? "..." : "Rescind"}
      </Button>
    </div>
  );
};
