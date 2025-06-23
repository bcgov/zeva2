"use client";

import { Button } from "@/app/lib/components";
import { PenaltyCreditStatus } from "@/prisma/generated/client";
import { useCallback, useState, useTransition } from "react";
import { directorUpdate } from "../actions";
import { useRouter } from "next/navigation";

export const PenaltyCreditActionsClient = (props: {
  penaltyCreditId: number;
}) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [comment, setComment] = useState<string>("");

  const handleCommentChange = useCallback((c: string) => {
    setComment(c);
  }, []);

  const handleAction = useCallback(
    (status: PenaltyCreditStatus) => {
      startTransition(async () => {
        try {
          const commentToSubmit = comment === "" ? undefined : comment;
          await directorUpdate(props.penaltyCreditId, status, commentToSubmit);
          router.refresh();
        } catch (e) {
          if (e instanceof Error) {
            setError(e.message);
          }
        }
      });
    },
    [props.penaltyCreditId, comment, router],
  );

  return (
    <div>
      {error && <p className="text-red-600">{error}</p>}

      <input
        type="text"
        placeholder="Comment (optional)"
        value={comment}
        className="border p-2 w-full"
        onChange={(e) => {
          handleCommentChange(e.target.value);
        }}
      />

      <Button
        disabled={isPending}
        onClick={() => {
          handleAction(PenaltyCreditStatus.APPROVED);
        }}
      >
        Approve
      </Button>

      <Button
        disabled={isPending}
        onClick={() => {
          handleAction(PenaltyCreditStatus.REJECTED);
        }}
      >
        Reject
      </Button>
    </div>
  );
};
