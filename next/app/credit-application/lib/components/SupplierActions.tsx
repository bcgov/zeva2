"use client";

import { Button } from "@/app/lib/components";
import {
  CreditApplicationSupplierStatus,
  ModelYear,
  Role,
} from "@/prisma/generated/enums";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import { supplierDelete, supplierSubmit } from "../actions";
import { getNormalizedComment } from "@/app/lib/utils/comment";
import { Routes } from "@/app/lib/constants";
import { CommentBox } from "@/app/lib/components/inputs/CommentBox";
import { getModelYearEnumsToStringsMap } from "@/app/lib/utils/enumMaps";

export const SupplierActions = (props: {
  creditApplicationId: number;
  status: CreditApplicationSupplierStatus;
  userRoles: Role[];
  partOfMyrModelYear: ModelYear | null;
}) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string>("");

  const modelYearsMap = useMemo(() => {
    return getModelYearEnumsToStringsMap();
  }, []);

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

  const handleSubmit = useCallback(
    (partOfMyr: boolean) => {
      startTransition(async () => {
        const response = await supplierSubmit(
          props.creditApplicationId,
          partOfMyr,
          getNormalizedComment(comment),
        );
        if (response.responseType === "error") {
          setError(response.message);
        } else {
          router.refresh();
        }
      });
    },
    [props.creditApplicationId, comment],
  );

  if (props.status === CreditApplicationSupplierStatus.DRAFT) {
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
          <>
            <Button
              variant="secondary"
              onClick={() => handleSubmit(false)}
              disabled={isPending}
            >
              {isPending ? "..." : "Submit"}
            </Button>
            {props.partOfMyrModelYear && (
              <Button
                variant="secondary"
                onClick={() => handleSubmit(true)}
                disabled={isPending}
              >
                {isPending
                  ? "..."
                  : `Submit as part of ${modelYearsMap[props.partOfMyrModelYear]} Model Year Report`}
              </Button>
            )}
          </>
        )}
      </>
    );
  }
  if (props.status === CreditApplicationSupplierStatus.REJECTED) {
    return (
      <Button variant="secondary" onClick={handleDelete} disabled={isPending}>
        {isPending ? "..." : "Delete"}
      </Button>
    );
  }
  return null;
};
