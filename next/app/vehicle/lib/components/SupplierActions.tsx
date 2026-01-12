"use client";

import { Button } from "@/app/lib/components";
import { Role, VehicleStatus } from "@/prisma/generated/client";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import {
  supplierActivate,
  supplierDeactivate,
  supplierDelete,
  supplierSubmit,
} from "../actions";
import { getNormalizedComment } from "@/app/lib/utils/comment";
import { Routes } from "@/app/lib/constants";
import { CommentBox } from "@/app/lib/components/inputs/CommentBox";

export const SupplierActions = (props: {
  vehicleId: number;
  status: VehicleStatus;
  isActive: boolean;
  userRoles: Role[];
}) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleDelete = useCallback(() => {
    startTransition(async () => {
      const response = await supplierDelete(props.vehicleId);
      if (response.responseType === "error") {
        setError(response.message);
      } else {
        router.push(Routes.Vehicle);
      }
    });
  }, [props.vehicleId]);

  const handleGoToEdit = useCallback(() => {
    router.push(`${Routes.Vehicle}/${props.vehicleId}/edit`);
  }, [props.vehicleId]);

  const handleSubmit = useCallback(() => {
    setError("");
    startTransition(async () => {
      const response = await supplierSubmit(
        props.vehicleId,
        getNormalizedComment(comment),
      );
      if (response.responseType === "error") {
        setError(response.message);
      } else {
        router.refresh();
      }
    });
  }, [props.vehicleId, comment]);

  const handleActivateDeactivate = useCallback(
    (type: "activate" | "deactivate") => {
      setError("");
      startTransition(async () => {
        let response;
        if (type === "activate") {
          response = await supplierActivate(props.vehicleId);
        } else if (type === "deactivate") {
          response = await supplierDeactivate(props.vehicleId);
        } else {
          setError("Invalid Action!");
          return;
        }
        if (response.responseType === "error") {
          setError(response.message);
        } else {
          router.refresh();
        }
      });
    },
    [props.vehicleId],
  );

  if (props.status === VehicleStatus.VALIDATED && props.isActive) {
    return (
      <Button
        variant="secondary"
        onClick={() => {
          handleActivateDeactivate("deactivate");
        }}
        disabled={isPending}
      >
        {isPending ? "..." : "Deactivate"}
      </Button>
    );
  }
  if (props.status === VehicleStatus.VALIDATED && !props.isActive) {
    return (
      <Button
        variant="secondary"
        onClick={() => {
          handleActivateDeactivate("activate");
        }}
        disabled={isPending}
      >
        {isPending ? "..." : "Activate"}
      </Button>
    );
  }
  if (props.status === VehicleStatus.REJECTED) {
    return (
      <Button variant="secondary" onClick={handleDelete} disabled={isPending}>
        {isPending ? "..." : "Delete"}
      </Button>
    );
  }
  if (
    props.status === VehicleStatus.DRAFT ||
    props.status === VehicleStatus.RETURNED_TO_SUPPLIER
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
