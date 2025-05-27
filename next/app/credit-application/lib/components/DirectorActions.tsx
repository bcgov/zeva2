"use client";

import { Button } from "@/app/lib/components";
import { CreditApplicationStatus } from "@/prisma/generated/client";
import { useRouter } from "next/navigation";
import { useCallback, useTransition } from "react";
import { CreditsPayload } from "./ParsedApplication";
import { directorApprove } from "../actions";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";

export const DirectorActions = (props: {
  creditApplicationId: number;
  status: CreditApplicationStatus;
  credits: CreditsPayload | null;
  approvedVins: string[] | null;
}) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const approve = useCallback(() => {
    // update status, create credit transactions from payload
    startTransition(async () => {
      try {
        if (props.credits && props.approvedVins) {
          await directorApprove(
            props.creditApplicationId,
            props.credits,
            props.approvedVins,
          );
          router.refresh();
        }
      } catch (e) {
        console.error(e);
      }
    });
  }, [props.creditApplicationId, props.credits, router]);

  if (!props.credits || !props.approvedVins) {
    return <LoadingSkeleton />;
  }
  return (
    <>
      {props.status === CreditApplicationStatus.RECOMMEND_APPROVAL && (
        <Button
          onClick={() => {
            approve();
          }}
          disabled={isPending}
        >
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
