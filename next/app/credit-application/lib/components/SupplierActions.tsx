"use client";

import { Button } from "@/app/lib/components";
import {
  CreditApplicationSupplierStatus,
  Role,
} from "@/prisma/generated/client";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { supplierDelete, supplierSubmit } from "../actions";
import { getNormalizedComment } from "@/app/lib/utils/comment";
import { Routes } from "@/app/lib/constants";
import { CommentBox } from "@/app/lib/components/inputs/CommentBox";

export const SupplierActions = (props: {
  creditApplicationId: number;
  status: CreditApplicationSupplierStatus;
  userRoles: Role[];
}) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleDelete = useCallback(() => {
    startTransition(async () => {
      const response = await supplierDelete(props.creditApplicationId);
      if (response.responseType === "error") {
        setError(response.message);
      } else {
        router.push(Routes.CreditApplication);
      }
    });
  }, [props.creditApplicationId]);

  const handleGoToEdit = useCallback(() => {
    router.push(
      `${Routes.CreditApplication}/${props.creditApplicationId}/edit`,
    );
  }, [props.creditApplicationId]);

  const handleSubmit = useCallback(() => {
    startTransition(async () => {
      const response = await supplierSubmit(
        props.creditApplicationId,
        getNormalizedComment(comment),
      );
      if (response.responseType === "error") {
        setError(response.message);
      } else {
        router.refresh();
      }
    });
  }, [props.creditApplicationId, comment]);

  if (
    props.status === CreditApplicationSupplierStatus.DRAFT ||
    props.status === CreditApplicationSupplierStatus.RETURNED_TO_SUPPLIER
  ) {
    return (
      <>
        {error && <p className="text-red-600">{error}</p>}
        <CommentBox
          comment={comment}
          setComment={setComment}
          disabled={isPending}
        />
        <Button variant="secondary" onClick={handleDelete} disabled={isPending}>
          {isPending ? "..." : "Delete"}
        </Button>
        <Button
          variant="secondary"
          onClick={handleGoToEdit}
          disabled={isPending}
        >
          {isPending ? "..." : "Edit"}
        </Button>
        {props.userRoles.includes(Role.SIGNING_AUTHORITY) && (
          <Button
            variant="secondary"
            onClick={handleSubmit}
            disabled={isPending}
          >
            {isPending ? "..." : "Submit"}
          </Button>
        )}
      </>
    );
  }
  return null;
};
