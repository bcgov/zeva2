"use client";

import { Button } from "@/app/lib/components";
import { CreditApplicationStatus } from "@/prisma/generated/client";
import { useRouter } from "next/navigation";
import { useCallback, useTransition } from "react";
import { analystRecommend, returnToSupplier } from "../actions";

export const AnalystActions = (props: {
  id: number;
  status: CreditApplicationStatus;
  validatedBefore: boolean;
  validateAction: () => Promise<void>;
  goToValidatedAction: (readOnly: boolean) => Promise<never>;
}) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleValidate = useCallback(() => {
    startTransition(async () => {
      try {
        await props.validateAction();
      } catch (e) {
        console.error(e);
      }
    });
  }, [props.validateAction]);

  const handleGoToValidated = useCallback(
    (edit: boolean) => {
      startTransition(() => {
        try {
          props.goToValidatedAction(!edit);
        } catch (e) {
          console.error(e);
        }
      });
    },
    [props.goToValidatedAction],
  );

  const handleRecommend = useCallback(
    (newStatus: CreditApplicationStatus) => {
      startTransition(async () => {
        try {
          await analystRecommend(props.id, newStatus);
          router.refresh();
        } catch (e) {
          console.error(e);
        }
      });
    },
    [router],
  );

  const handleReturnToSupplier = useCallback(() => {
    startTransition(async () => {
      try {
        await returnToSupplier(props.id);
        router.refresh();
      } catch (e) {
        console.error(e);
      }
    });
  }, []);

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
