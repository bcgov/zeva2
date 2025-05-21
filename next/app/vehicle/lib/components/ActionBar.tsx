"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateStatus } from "../actions";
import { VehicleStatus } from "@/prisma/generated/client";

type Props = {
  vehicleId: number;
  userIsGov: Boolean;
};

export default function ActionBar({ vehicleId, userIsGov }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (choice: VehicleStatus) => {
    startTransition(async () => {
      try {
        await updateStatus(choice, vehicleId);
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
            disabled={isPending}
          >
            {isPending ? "..." : "Reject"}
          </button>
          <button
            onClick={() => handleSubmit(VehicleStatus.VALIDATED)}
            disabled={isPending}
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
            disabled={isPending}
          >
            {isPending ? "..." : "Request Changes"}
          </button>
        </>
      )}
      {!userIsGov && (
        <>
          <button
            onClick={() => handleSubmit(VehicleStatus.SUBMITTED)}
            disabled={isPending}
          >
            {isPending ? "..." : "Submit"}
          </button>
          <button
            onClick={() => handleSubmit(VehicleStatus.DELETED)}
            disabled={isPending}
          >
            {isPending ? "..." : "Delete"}
          </button>
        </>
      )}
    </div>
  );
}
