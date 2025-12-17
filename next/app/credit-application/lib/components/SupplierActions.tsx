"use client";

import { Button } from "@/app/lib/components";
import { CreditApplicationStatus, Role } from "@/prisma/generated/client";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { supplierDelete, supplierSubmit } from "../actions";
import { getNormalizedComment } from "../utils";
import { Routes } from "@/app/lib/constants";
import { CommentBox } from "@/app/lib/components/inputs/CommentBox";

export const SupplierActions = (props: {
  creditApplicationId: number;
  status: CreditApplicationStatus;
  userRoles: Role[];
}) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [comment, setComment] = useState<string>("");

  const handleDelete = useCallback(() => {
    startTransition(async () => {
      const response = await supplierDelete(props.creditApplicationId);
      if (response.responseType === "error") {
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
      } else {
        router.refresh();
      }
    });
  }, [props.creditApplicationId, comment]);

  if (props.status !== CreditApplicationStatus.DRAFT) {
    return null;
  }
  return (
    <>
      <CommentBox
        comment={comment}
        setComment={setComment}
        disabled={isPending}
      />
      <Button variant="secondary" onClick={handleDelete} disabled={isPending}>
        {isPending ? "..." : "Delete"}
      </Button>
      <Button variant="secondary" onClick={handleGoToEdit} disabled={isPending}>
        {isPending ? "..." : "Edit"}
      </Button>
      {props.userRoles.includes(Role.SIGNING_AUTHORITY) && (
        <Button variant="secondary" onClick={handleSubmit} disabled={isPending}>
          {isPending ? "..." : "Submit"}
        </Button>
      )}
    </>
  );
};
