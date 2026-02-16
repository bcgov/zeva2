"use client";

import { Button } from "@/app/lib/components";
import { AgreementStatus } from "@/prisma/generated/enums";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { issueAgreement, returnToAnalyst } from "../actions";
import { getNormalizedComment } from "@/app/lib/utils/comment";
import { CommentBox } from "@/app/lib/components/inputs/CommentBox";
import { Routes } from "@/app/lib/constants";

export const DirectorActions = (props: {
  agreementId: number;
  status: AgreementStatus;
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleReturnToAnalyst = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        const response = await returnToAnalyst(
          props.agreementId,
          getNormalizedComment(comment),
        );
        if (response.responseType === "error") {
          throw new Error(response.message);
        }
        router.push(Routes.CreditAgreements);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, [props.agreementId, comment]);

  const handleIssue = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        const response = await issueAgreement(
          props.agreementId,
          getNormalizedComment(comment),
        );
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
  }, [props.agreementId, comment]);

  if (props.status !== AgreementStatus.RECOMMEND_APPROVAL) {
    return null;
  }

  return (
    <>
      <div className="mt-4">
        <p className="py-1 font-semibold text-primaryBlue">Optional Comment</p>
        <CommentBox
          comment={comment}
          setComment={setComment}
          disabled={isPending}
        />
      </div>
      <div className="flex flex-row gap-12 my-4">
        {error && <p className="text-red-600">{error}</p>}
        <Button
          variant="secondary"
          onClick={handleReturnToAnalyst}
          disabled={isPending}
        >
          Return to Analyst
        </Button>
        <Button variant="primary" onClick={handleIssue} disabled={isPending}>
          Issue
        </Button>
      </div>
    </>
  );
};
