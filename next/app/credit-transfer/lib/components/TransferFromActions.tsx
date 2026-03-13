"use client";

import { Button } from "@/app/lib/components";
import { CommentBox } from "@/app/lib/components/inputs/CommentBox";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { deleteTransfer, rescindTransfer, submitTransfer } from "../actions";
import { getNormalizedComment } from "@/app/lib/utils/comment";
import { Routes } from "@/app/lib/constants";

export const TransferFromActions = (props: {
  id: number;
  type: "draft" | "rescindable";
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleRescindOrSubmit = useCallback(
    (type: "rescind" | "submit") => {
      setError("");
      startTransition(async () => {
        try {
          let response;
          switch (type) {
            case "rescind":
              response = await rescindTransfer(
                props.id,
                getNormalizedComment(comment),
              );
              break;
            case "submit":
              response = await submitTransfer(
                props.id,
                getNormalizedComment(comment),
              );
              break;
          }
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

  const handleGoToEdit = useCallback(() => {
    router.push(`${Routes.CreditTransfers}/${props.id}/edit`);
  }, [props.id]);

  const handleDelete = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        await deleteTransfer(props.id);
        router.push(Routes.CreditTransfers);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, [props.id]);

  switch (props.type) {
    case "draft":
      return (
        <div className="space-y-2">
          {error && <p className="text-red-600">{error}</p>}
          <CommentBox
            comment={comment}
            setComment={setComment}
            disabled={isPending}
          />
          <Button variant="danger" onClick={handleDelete} disabled={isPending}>
            {isPending ? "..." : "Delete"}
          </Button>
          <Button
            variant="secondary"
            onClick={handleGoToEdit}
            disabled={isPending}
          >
            {isPending ? "..." : "Edit"}
          </Button>
          <Button
            variant="primary"
            onClick={() => handleRescindOrSubmit("submit")}
            disabled={isPending}
          >
            {isPending ? "..." : "Submit to Transfer Partner"}
          </Button>
        </div>
      );
    case "rescindable":
      return (
        <div className="space-y-2">
          {error && <p className="text-red-600">{error}</p>}
          <CommentBox
            comment={comment}
            setComment={setComment}
            disabled={isPending}
          />
          <Button
            variant="danger"
            onClick={() => handleRescindOrSubmit("rescind")}
            disabled={isPending}
          >
            {isPending ? "..." : "Rescind"}
          </Button>
        </div>
      );
  }
};
