"use client";

import { Button } from "@/app/lib/components";
import { Routes } from "@/app/lib/constants";
import { AgreementStatus } from "@/prisma/generated/client";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { deleteAgreement, recommendApproval } from "../actions";
import { getNormalizedComment } from "@/app/lib/utils/comment";
import { CommentBox } from "@/app/lib/components/inputs/CommentBox";

export const AnalystActions = (props: {
  agreementId: number;
  status: AgreementStatus;
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleRecommend = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        const response = await recommendApproval(
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

  const handleDelete = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        const response = await deleteAgreement(props.agreementId);
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
  }, [props.agreementId]);

  const handleGoToEditAgreement = useCallback(() => {
    router.push(`${Routes.CreditAgreements}/${props.agreementId}/edit`);
  }, [props.agreementId]);

  if (
    props.status !== AgreementStatus.DRAFT &&
    props.status !== AgreementStatus.RETURNED_TO_ANALYST
  ) {
    return null;
  }

  return (
    <div>
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
        <Button variant="secondary" onClick={handleGoToEditAgreement}>
          Edit
        </Button>
        <Button variant="primary" onClick={handleRecommend}>
          Submit to Director
        </Button>
        <Button variant="danger" onClick={handleDelete}>
          Delete
        </Button>
      </div>
    </div>
  );
};
