"use client";

import { useState, useTransition } from "react";
import { createVehicleComment } from "../actions";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function CommentInput({ vehicleId }: { vehicleId: number }) {
  const [comment, setComment] = useState("");
  const [isPending, startTransition] = useTransition();
  const { data: session } = useSession();
  const userName = session?.user?.name;
  const router = useRouter();

  const handleSubmit = () => {
    if (!userName || !comment.trim()) return;
    startTransition(() => {
      createVehicleComment(vehicleId, comment, userName);
      setComment("");
      router.refresh();
    });
  };

  return (
    <div className="space-y-2">
      <textarea
        className="w-full border  p-2"
        rows={3}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Write a comment..."
      />
      <button onClick={handleSubmit} disabled={isPending}>
        {isPending ? "Posting..." : "Post Comment"}
      </button>
    </div>
  );
}
