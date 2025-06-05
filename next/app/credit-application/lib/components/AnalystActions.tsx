"use client";

import { Button } from "@/app/lib/components";
import { CreditApplicationStatus } from "@/prisma/generated/client";
import { useRouter } from "next/navigation";
import { useCallback, useTransition } from "react";
import { analystRecommend } from "../actions";

export const AnalystActions = (props: {
  id: number;
  status: CreditApplicationStatus;
  validatedBefore: boolean;
  validateAction: () => Promise<void>;
  goToValidatedAction: (readOnly: boolean) => void;
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

  const handleEditValidated = useCallback(() => {
    startTransition(() => {
      try {
        props.goToValidatedAction(false);
      } catch (e) {
        console.error(e);
      }
    });
  }, [props.goToValidatedAction]);

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

  return (
    <>
      {(props.status === CreditApplicationStatus.SUBMITTED ||
        props.status === CreditApplicationStatus.RETURNED_TO_ANALYST) && (
        <Button onClick={handleValidate} disabled={isPending}>
          {isPending ? "..." : "Validate"}
        </Button>
      )}
      {(props.status === CreditApplicationStatus.SUBMITTED ||
        props.status === CreditApplicationStatus.RETURNED_TO_ANALYST) &&
        props.validatedBefore && (
          <Button onClick={handleEditValidated} disabled={isPending}>
            {isPending ? "..." : "Edit Validated Records"}
          </Button>
        )}
      {(props.status === CreditApplicationStatus.SUBMITTED ||
        props.status === CreditApplicationStatus.RETURNED_TO_ANALYST) &&
        props.validatedBefore && (
          <>
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
            <Button onClick={() => {}} disabled={isPending}>
              {isPending ? "..." : "Return to Supplier"}
            </Button>
          </>
        )}
    </>
  );
};
