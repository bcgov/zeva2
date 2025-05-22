"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateStatus } from "../actions";
import { VehicleStatus, Vehicle } from "@/prisma/generated/client";

type Props = {
  vehicleId: number;
  userIsGov: Boolean;
  vehicle: Vehicle;
};

export default function ActionBar({ vehicleId, userIsGov, vehicle }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (choice: VehicleStatus) => {
    startTransition(async () => {
      try {
        await updateStatus(vehicle, choice);
        router.refresh();
      } catch (e) {
        console.error(e);
      }
    });
  };

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
}
