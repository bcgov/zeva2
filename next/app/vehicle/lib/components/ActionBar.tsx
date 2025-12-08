"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { VehicleStatus } from "@/prisma/generated/client";
import { updateStatus } from "../actions";
import { Button } from "@/app/lib/components";
import { Routes } from "@/app/lib/constants";
import { getNormalizedComment } from "@/app/credit-application/lib/utils";

export const ActionBar = (props: {
  userIsGov: boolean;
  vehicleId: number;
  vehicleStatus: VehicleStatus;
}) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [error, setError] = useState("");
  const [comment, setComment] = useState("");

  const handleSubmit = useCallback(
    (status: VehicleStatus) => {
      startTransition(async () => {
        const response = await updateStatus(
          props.vehicleId,
          status,
          getNormalizedComment(comment),
        );
        if (response.responseType === "error") {
          setError(response.message);
        } else if (status === VehicleStatus.DELETED) {
          router.push(Routes.Vehicle);
        } else {
          router.refresh();
        }
      });
    },
    [props.vehicleId, comment, router],
  );

  const handleGoToNewVehicleForm = useCallback(() => {
    router.push(`${Routes.Vehicle}/new`);
  }, []);

  return (
    <div className="space-y-2">
      {error && <p className="text-red-600">{error}</p>}
      {props.userIsGov && props.vehicleStatus === VehicleStatus.SUBMITTED && (
        <>
          <textarea
            className="w-full border  p-2"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Optional Comment"
            disabled={isPending}
          />
          <Button
            variant="danger"
            onClick={() => handleSubmit(VehicleStatus.REJECTED)}
            disabled={isPending}
          >
            {isPending ? "..." : "Reject"}
          </Button>
          <Button
            variant="primary"
            onClick={() => handleSubmit(VehicleStatus.VALIDATED)}
            disabled={isPending}
          >
            {isPending ? "..." : "Validate"}
          </Button>
        </>
      )}
      {!props.userIsGov && props.vehicleStatus === VehicleStatus.REJECTED && (
        <>
          <Button
            variant="danger"
            onClick={() => handleSubmit(VehicleStatus.DELETED)}
            disabled={isPending}
          >
            {isPending ? "..." : "Delete"}
          </Button>
          <Button
            variant="secondary"
            onClick={handleGoToNewVehicleForm}
            disabled={isPending}
          >
            {isPending ? "..." : "Submit a new Vehicle"}
          </Button>
        </>
      )}
    </div>
  );
};
