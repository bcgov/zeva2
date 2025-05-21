"use client";

import { useState, useTransition } from "react";
import { createVehicleComment } from "../actions";
import { useRouter } from "next/navigation";

export default function CommentInput({ vehicleId }: { vehicleId: number }) {
  const [comment, setComment] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const handleSubmit = () => {
    if (!comment.trim()) return;
    startTransition(async () => {
      setComment("");
      await createVehicleComment(vehicleId, comment);
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
