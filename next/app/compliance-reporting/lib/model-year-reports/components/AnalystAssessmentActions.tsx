"use client";

import { Button } from "@/app/lib/components";
import { Routes } from "@/app/lib/constants";
import { ModelYearReportStatus } from "@/prisma/generated/enums";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { submitAssessment } from "../actions";
import { getNormalizedComment } from "@/app/lib/utils/comment";
import { Textarea } from "@/app/lib/components/inputs/Textarea";

export const AnalystAssessmentActions = (props: {
  myrId: number;
  status: ModelYearReportStatus;
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleSubmitToDirector = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        const response = await submitAssessment(
          props.myrId,
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
  }, [props.myrId, comment]);

  const handleGoToEditAssessment = useCallback(() => {
    router.push(`${Routes.ModelYearReports}/${props.myrId}/assessment/edit`);
  }, [props.myrId]);

  if (
    props.status === ModelYearReportStatus.RETURNED_TO_ANALYST ||
    props.status === ModelYearReportStatus.SUBMITTED_TO_GOVERNMENT
  ) {
    return (
      <div>
        {error && <p className="text-red-600">{error}</p>}
        <Textarea value={comment} onChange={setComment} disabled={isPending} />
        <Button
          variant="secondary"
          onClick={handleGoToEditAssessment}
          disabled={isPending}
        >
          {isPending ? "..." : "Start Over"}
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmitToDirector}
          disabled={isPending}
        >
          {isPending ? "..." : "Submit to Director"}
        </Button>
      </div>
    );
  }
  return null;
};
