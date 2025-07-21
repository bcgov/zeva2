"use client";

import { useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateStatus } from "../actions";
import { VehicleStatus } from "@/prisma/generated/client";
import { SerializedVehicleWithOrg } from "../data";

type Props = {
  userIsGov: Boolean;
  vehicle: SerializedVehicleWithOrg;
};

export const ActionBar = ({ userIsGov, vehicle }: Props) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = useCallback(
    (choice: VehicleStatus) => {
      startTransition(async () => {
        const response = await updateStatus(vehicle.id, choice);
        if (response.responseType === "error") {
          console.error(response.message);
        } else {
          router.refresh();
        }
      });
    },
    [vehicle.id, router],
  );

  return (
    <div className="space-y-2">
      {userIsGov && (
        <>
          <button
            onClick={() => handleSubmit(VehicleStatus.REJECTED)}
            disabled={isPending || vehicle.status !== VehicleStatus.SUBMITTED}
          >
            {isPending ? "..." : "Reject"}
          </button>
          <button
            onClick={() => handleSubmit(VehicleStatus.VALIDATED)}
            disabled={isPending || vehicle.status !== VehicleStatus.SUBMITTED}
          >
            {isPending ? "..." : "Validate"}
          </button>

          <button
            onClick={() => handleSubmit(VehicleStatus.DELETED)}
            disabled={isPending}
          >
            {isPending ? "..." : "Delete"}
          </button>
          <button
            onClick={() => handleSubmit(VehicleStatus.CHANGES_REQUESTED)}
            disabled={isPending || vehicle.status !== VehicleStatus.SUBMITTED}
          >
            {isPending ? "..." : "Request Changes"}
          </button>
        </>
      )}
      {!userIsGov && (
        <>
          <button
            onClick={() => handleSubmit(VehicleStatus.SUBMITTED)}
            disabled={isPending || vehicle.status !== VehicleStatus.DRAFT}
          >
            {isPending ? "..." : "Submit"}
          </button>
          <button
            onClick={() => handleSubmit(VehicleStatus.DELETED)}
            disabled={isPending || vehicle.status !== VehicleStatus.DRAFT}
          >
            {isPending ? "..." : "Delete"}
          </button>
        </>
      )}
    </div>
  );
};
