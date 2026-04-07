"use client";

import { Button } from "@/app/lib/components";
import { ModelYearReportStatus } from "@/prisma/generated/enums";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { assessSupplementary, returnSupplementaryToAnalyst } from "../actions";
import { getNormalizedComment } from "@/app/lib/utils/comment";
import { Textarea } from "@/app/lib/components/inputs/Textarea";
import { Routes } from "@/app/lib/constants";

export const SupplementaryDirectorActions = (props: {
  suppId: number;
  status: ModelYearReportStatus;
  myrId?: number;
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleReturnToAnalyst = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        const response = await returnSupplementaryToAnalyst(
          props.suppId,
          getNormalizedComment(comment),
        );
        if (response.responseType === "error") {
          throw new Error(response.message);
        }
        if (props.myrId) {
          router.push(`${Routes.ComplianceReporting}/${props.myrId}`);
        } else {
          router.push(Routes.LegacySupplementary);
        }
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, [props.suppId, props.myrId, comment]);

  const handleAssessSupp = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        const response = await assessSupplementary(
          props.suppId,
          getNormalizedComment(comment),
        );
        if (response.responseType === "error") {
          throw new Error(response.message);
        }
        router.refresh();
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, [props.suppId, comment]);

  if (props.status === ModelYearReportStatus.SUBMITTED_TO_DIRECTOR) {
    return (
      <div className="space-y-2">
        <Textarea value={comment} onChange={setComment} disabled={isPending} />
        {error && <p className="text-red-600">{error}</p>}
        <Button
          variant="secondary"
          onClick={handleReturnToAnalyst}
          disabled={isPending}
        >
          {isPending ? "..." : "Return To Analyst"}
        </Button>
        <Button
          variant="primary"
          onClick={handleAssessSupp}
          disabled={isPending}
        >
          {isPending ? "..." : "Issue Reassessment"}
        </Button>
      </div>
    );
  }
  return null;
};
