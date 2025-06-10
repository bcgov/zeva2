"use client";

import { Button } from "@/app/lib/components";
import { CreditApplicationStatus } from "@/prisma/generated/client";
import { useRouter } from "next/navigation";
import { useCallback, useTransition } from "react";
import { directorApprove, directorReject, returnToAnalyst } from "../actions";
import { CreditApplicationCreditSerialized } from "../utils";

export const DirectorActions = (props: {
  id: number;
  status: CreditApplicationStatus;
  credits: CreditApplicationCreditSerialized[];
  goToValidatedAction: () => Promise<never>;
}) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleViewValidated = useCallback(() => {
    startTransition(async () => {
      try {
        await props.goToValidatedAction();
      } catch (e) {
        console.error(e);
      }
    });
  }, [props.goToValidatedAction]);

  const handleReturn = useCallback(() => {
    startTransition(async () => {
      try {
        await returnToAnalyst(props.id);
        router.refresh();
      } catch (e) {
        console.error(e);
      }
    });
  }, [props.id, router]);

  const handleApprove = useCallback(() => {
    startTransition(async () => {
      try {
        await directorApprove(props.id, props.credits);
        router.refresh();
      } catch (e) {
        console.error(e);
      }
    });
  }, [props.id, props.credits, router]);

  const handleReject = useCallback(() => {
    startTransition(async () => {
      try {
        await directorReject(props.id);
        router.refresh();
      } catch (e) {
        console.error(e);
      }
    });
  }, [props.id, router]);

  return (
    <>
      {(props.status === CreditApplicationStatus.RECOMMEND_APPROVAL ||
        props.status === CreditApplicationStatus.RECOMMEND_REJECTION ||
        props.status === CreditApplicationStatus.APPROVED ||
        props.status === CreditApplicationStatus.REJECTED) && (
        <Button onClick={handleViewValidated} disabled={isPending}>
          {isPending ? "..." : "View Validated Records"}
        </Button>
      )}
      {(props.status === CreditApplicationStatus.RECOMMEND_APPROVAL ||
        props.status === CreditApplicationStatus.RECOMMEND_REJECTION) && (
        <Button onClick={handleReturn} disabled={isPending}>
          {isPending ? "..." : "Return to Analyst"}
        </Button>
      )}
      {props.status === CreditApplicationStatus.RECOMMEND_APPROVAL && (
        <Button onClick={handleApprove} disabled={isPending}>
          {isPending ? "..." : "Approve"}
        </Button>
      )}
      {props.status === CreditApplicationStatus.RECOMMEND_REJECTION && (
        <Button onClick={handleReject} disabled={isPending}>
          {isPending ? "..." : "Reject"}
        </Button>
      )}
    </>
  );
};
