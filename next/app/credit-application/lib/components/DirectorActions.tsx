"use client";

import { Button } from "@/app/lib/components";
import { CreditApplicationStatus } from "@/prisma/generated/client";
import { useRouter } from "next/navigation";
import { useCallback, useTransition } from "react";

export const DirectorActions = (props: {
  status: CreditApplicationStatus;
  approveAction: () => Promise<void>;
}) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleApprove = useCallback(() => {
    startTransition(async () => {
      try {
        await props.approveAction();
        router.refresh();
      } catch (e) {
        console.error(e);
      }
    });
  }, [props.approveAction, router]);

  return (
    <>
      {props.status === CreditApplicationStatus.RECOMMEND_APPROVAL && (
        <Button onClick={handleApprove} disabled={isPending}>
          {isPending ? "..." : "Approve"}
        </Button>
      )}
      {props.status === CreditApplicationStatus.RECOMMEND_REJECTION && (
        <Button onClick={() => {}} disabled={isPending}>
          {isPending ? "..." : "Reject"}
        </Button>
      )}
      <Button onClick={() => {}} disabled={isPending}>
        {isPending ? "..." : "Return to Analyst"}
      </Button>
    </>
  );
};
