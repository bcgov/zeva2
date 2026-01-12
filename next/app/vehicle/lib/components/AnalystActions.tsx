"use client";

import { Button } from "@/app/lib/components";
import { VehicleStatus } from "@/prisma/generated/client";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { analystUpdate } from "../actions";
import { CommentBox } from "@/app/lib/components/inputs/CommentBox";
import { getNormalizedComment } from "@/app/lib/utils/comment";

export const AnalystActions = (props: {
  vehicleId: number;
  status: VehicleStatus;
}) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleUpdate = useCallback(
    (
      newStatus:
        | typeof VehicleStatus.REJECTED
        | typeof VehicleStatus.RETURNED_TO_SUPPLIER
        | typeof VehicleStatus.VALIDATED,
    ) => {
      setError("");
      if (
        (newStatus === VehicleStatus.REJECTED ||
          newStatus === VehicleStatus.RETURNED_TO_SUPPLIER) &&
        !comment.trim()
      ) {
        setError("Comment required!");
        return;
      }
      startTransition(async () => {
        const response = await analystUpdate(
          props.vehicleId,
          newStatus,
          getNormalizedComment(comment),
        );
        if (response.responseType === "error") {
          setError(response.message);
        } else {
          router.refresh();
        }
      });
    },
    [props.vehicleId],
  );

  if (props.status !== VehicleStatus.SUBMITTED) {
    return null;
  }
  return (
    <>
      {error && <p className="text-red-600">{error}</p>}
      <CommentBox
        comment={comment}
        setComment={setComment}
        disabled={isPending}
        placeholder="Comment"
      />
      <Button
        variant="primary"
        onClick={() => handleUpdate(VehicleStatus.REJECTED)}
        disabled={isPending}
      >
        {isPending ? "..." : "Reject"}
      </Button>
      <Button
        variant="primary"
        onClick={() => {
          handleUpdate(VehicleStatus.RETURNED_TO_SUPPLIER);
        }}
        disabled={isPending}
      >
        {isPending ? "..." : "Return To Supplier"}
      </Button>
      <Button
        variant="primary"
        onClick={() => {
          handleUpdate(VehicleStatus.VALIDATED);
        }}
        disabled={isPending}
      >
        {isPending ? "..." : "Validate"}
      </Button>
    </>
  );
};
