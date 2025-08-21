"use client";

import { Button } from "@/app/lib/components";
import { CreditApplicationStatus } from "@/prisma/generated/client";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import {
  analystRecommend,
  returnToSupplier,
  validateCreditApplication,
} from "../actions";
import { Routes } from "@/app/lib/constants";
import { CommentBox } from "@/app/lib/components/inputs/CommentBox";
import { getNormalizedComment } from "../utils";

export const AnalystActions = (props: {
  id: number;
  status: CreditApplicationStatus;
  validatedBefore: boolean;
}) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [comment, setComment] = useState<string>("");

  const refresh = useCallback(() => {
    setComment("");
    router.refresh();
  }, [router]);

  const handleValidate = useCallback(() => {
    startTransition(async () => {
      const response = await validateCreditApplication(props.id);
      if (response.responseType === "error") {
        console.error(response.message);
      } else {
        router.push(`${Routes.CreditApplication}/${props.id}/validated`);
      }
    });
  }, [props.id, router]);

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

  const handleRecommend = useCallback(
    (newStatus: CreditApplicationStatus) => {
      startTransition(async () => {
        const response = await analystRecommend(
          props.id,
          newStatus,
          getNormalizedComment(comment),
        );
        if (response.responseType === "error") {
          console.error(response.message);
        } else {
          refresh();
        }
      });
    },
    [props.id, comment, refresh],
  );

  const handleReturnToSupplier = useCallback(() => {
    startTransition(async () => {
      const response = await returnToSupplier(
        props.id,
        getNormalizedComment(comment),
      );
      if (response.responseType === "error") {
        console.error(response.message);
      } else {
        refresh();
      }
    });
  }, [props.id, comment, refresh]);

  return (
    <>
      {(props.status === CreditApplicationStatus.SUBMITTED ||
        props.status === CreditApplicationStatus.RETURNED_TO_ANALYST) && (
        <Button onClick={handleValidate} disabled={isPending}>
          {isPending ? "..." : "Validate"}
        </Button>
      )}
      {props.status !== CreditApplicationStatus.SUBMITTED &&
        props.status !== CreditApplicationStatus.RETURNED_TO_ANALYST &&
        props.validatedBefore && (
          <Button
            onClick={() => {
              handleGoToValidated(false);
            }}
            disabled={isPending}
          >
            {isPending ? "..." : "View Validated Records"}
          </Button>
        )}
      {(props.status === CreditApplicationStatus.SUBMITTED ||
        props.status === CreditApplicationStatus.RETURNED_TO_ANALYST) &&
        props.validatedBefore && (
          <>
            <CommentBox
              comment={comment}
              setComment={setComment}
              disabled={isPending}
            />
            <Button
              onClick={() => {
                handleGoToValidated(true);
              }}
              disabled={isPending}
            >
              {isPending ? "..." : "Edit Validated Records"}
            </Button>
            <Button
              onClick={() => {
                handleRecommend(CreditApplicationStatus.RECOMMEND_APPROVAL);
              }}
              disabled={isPending}
            >
              {isPending ? "..." : "Recommend Approval"}
            </Button>
            <Button
              onClick={() => {
                handleRecommend(CreditApplicationStatus.RECOMMEND_REJECTION);
              }}
              disabled={isPending}
            >
              {isPending ? "..." : "Recommend Rejection"}
            </Button>
            <Button onClick={handleReturnToSupplier} disabled={isPending}>
              {isPending ? "..." : "Return to Supplier"}
            </Button>
          </>
        )}
    </>
  );
};
