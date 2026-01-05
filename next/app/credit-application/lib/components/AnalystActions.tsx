"use client";

import { Button } from "@/app/lib/components";
import { CreditApplicationStatus } from "@/prisma/generated/client";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { analystRecommend, validateCreditApplication } from "../actions";
import { Routes } from "@/app/lib/constants";
import { CommentBox } from "@/app/lib/components/inputs/CommentBox";
import { getNormalizedComment } from "@/app/lib/utils/comment";

export const AnalystActions = (props: {
  id: number;
  status: CreditApplicationStatus;
  validatedBefore: boolean;
}) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleValidate = useCallback(() => {
    startTransition(async () => {
      const response = await validateCreditApplication(props.id);
      if (response.responseType === "error") {
        setError(response.message);
      } else {
        router.push(`${Routes.CreditApplication}/${props.id}/validated`);
      }
    });
  }, [props.id]);

  const handleGoToValidated = useCallback(
    (edit: boolean) => {
      startTransition(() => {
        router.push(
          `${Routes.CreditApplication}/${props.id}/validated${edit ? "" : "?readOnly=Y"}`,
        );
      });
    },
    [props.id, router],
  );

  const handleRecommend = useCallback(() => {
    startTransition(async () => {
      const response = await analystRecommend(
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

  if (
    props.status === CreditApplicationStatus.DELETED ||
    props.status === CreditApplicationStatus.DRAFT ||
    props.status === CreditApplicationStatus.REJECTED
  ) {
    return null;
  }
  if (
    props.status === CreditApplicationStatus.APPROVED ||
    props.status === CreditApplicationStatus.RECOMMEND_APPROVAL
  ) {
    return (
      <Button
        variant="secondary"
        onClick={() => {
          handleGoToValidated(false);
        }}
        disabled={isPending}
      >
        {isPending ? "..." : "View Validated Records"}
      </Button>
    );
  }
  return (
    <>
      {error && <p className="text-red-600">{error}</p>}
      <CommentBox
        comment={comment}
        setComment={setComment}
        disabled={isPending}
      />
      <Button variant="primary" onClick={handleValidate} disabled={isPending}>
        {isPending ? "..." : "Validate"}
      </Button>
      {props.validatedBefore && (
        <>
          <Button
            variant="secondary"
            onClick={() => {
              handleGoToValidated(false);
            }}
            disabled={isPending}
          >
            {isPending ? "..." : "View Validated Records"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              handleGoToValidated(true);
            }}
            disabled={isPending}
          >
            {isPending ? "..." : "Edit Validated Records"}
          </Button>
        </>
      )}
      <Button
        variant="primary"
        onClick={() => {
          handleRecommend();
        }}
        disabled={isPending}
      >
        {isPending ? "..." : "Recommend Approval"}
      </Button>
    </>
  );
};
