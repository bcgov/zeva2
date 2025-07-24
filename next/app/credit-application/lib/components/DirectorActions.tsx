"use client";

import { Button } from "@/app/lib/components";
import { CreditApplicationStatus } from "@/prisma/generated/client";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { directorApprove, directorReject, returnToAnalyst } from "../actions";
import { CreditApplicationCreditSerialized } from "../utils";
import { Routes } from "@/app/lib/constants";
import { CommentBox } from "./CommentBox";

export const DirectorActions = (props: {
  id: number;
  status: CreditApplicationStatus;
  credits: CreditApplicationCreditSerialized[];
}) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [comment, setComment] = useState<string>("");

  const refresh = useCallback(() => {
    setComment("");
    router.refresh();
  }, [router]);

  const handleViewValidated = useCallback(() => {
    startTransition(() => {
      router.push(
        `${Routes.CreditApplication}/${props.id}/validated?readOnly=Y`,
      );
    });
  }, [props.id, router]);

  const handleReturn = useCallback(() => {
    startTransition(async () => {
      const response = await returnToAnalyst(props.id, comment);
      if (response.responseType === "error") {
        console.error(response.message);
      } else {
        refresh();
      }
    });
  }, [props.id, comment, refresh]);

  const handleApprove = useCallback(() => {
    startTransition(async () => {
      const response = await directorApprove(props.id, props.credits, comment);
      if (response.responseType === "error") {
        console.error(response.message);
      } else {
        refresh();
      }
    });
  }, [props.id, props.credits, comment, refresh]);

  const handleReject = useCallback(() => {
    startTransition(async () => {
      const response = await directorReject(props.id, comment);
      if (response.responseType === "error") {
        console.error(response.message);
      } else {
        refresh();
      }
    });
  }, [props.id, comment, refresh]);

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
        <>
          <CommentBox
            comment={comment}
            setComment={setComment}
            disabled={isPending}
          />
          <Button onClick={handleReturn} disabled={isPending}>
            {isPending ? "..." : "Return to Analyst"}
          </Button>
        </>
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
