"use client";

import { Button } from "@/app/lib/components";
import { CreditApplicationStatus } from "@/prisma/generated/enums";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import {
  analystRecommend,
  analystReject,
  validateCreditApplication,
} from "../actions";
import { Routes } from "@/app/lib/constants";
import { Textarea } from "@/app/lib/components/inputs/Textarea";
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
        router.push(`${Routes.CreditApplications}/${props.id}/validated`);
      }
    });
  }, [props.id]);

  const handleGoToValidated = useCallback(
    (edit: boolean) => {
      startTransition(() => {
        router.push(
          `${Routes.CreditApplications}/${props.id}/validated${edit ? "" : "?readOnly=Y"}`,
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

  const handleReject = useCallback(() => {
    startTransition(async () => {
      const response = await analystReject(
        props.id,
        getNormalizedComment(comment),
      );
      if (response.responseType === "error") {
        setError(response.message);
      } else {
        router.push(Routes.CreditApplications);
      }
    });
  }, [props.id, comment]);

  if (
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
      <Textarea value={comment} onChange={setComment} disabled={isPending} />
      <Button variant="primary" onClick={handleValidate} disabled={isPending}>
        {isPending ? "..." : "Validate"}
      </Button>
      <Button variant="primary" onClick={handleReject} disabled={isPending}>
        {isPending ? "..." : "Reject"}
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
      )}
    </>
  );
};
