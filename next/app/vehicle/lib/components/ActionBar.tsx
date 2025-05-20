"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { handleValidateorReject } from "../actions";

type Props = {
  vehicleId: number;
  userIsGov: Boolean;
};

export default function ActionBar({ vehicleId, userIsGov }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (choice: string) => {
    startTransition(async () => {
      await handleValidateorReject(choice, vehicleId);
      router.refresh();
    });
  };

  return (
    <div className="space-y-2">
      {userIsGov && (
        <>
          <button onClick={() => handleSubmit("reject")} disabled={isPending}>
            {isPending ? "..." : "Reject"}
          </button>
          <button onClick={() => handleSubmit("validate")} disabled={isPending}>
            {isPending ? "..." : "Validate"}
          </button>
          <button onClick={() => handleSubmit("delete")} disabled={isPending}>
            {isPending ? "..." : "Delete"}
          </button>
          <button
            onClick={() => handleSubmit("request changes")}
            disabled={isPending}
          >
            {isPending ? "..." : "Request Changes"}
          </button>
        </>
      )}
      {!userIsGov && (
        <>
          <button onClick={() => handleSubmit("submit")} disabled={isPending}>
            {isPending ? "..." : "Submit"}
          </button>
          <button onClick={() => handleSubmit("delete")} disabled={isPending}>
            {isPending ? "..." : "Delete"}
          </button>
        </>
      )}
    </div>
  );
}
