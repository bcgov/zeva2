"use client";

import { Button } from "@/app/lib/components";
import { Routes } from "@/app/lib/constants";
import { ModelYearReportStatus } from "@/prisma/generated/client";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { handleReturns } from "../actions";
import { getNormalizedComment } from "@/app/credit-application/lib/utils";
import { CommentBox } from "@/app/lib/components/inputs/CommentBox";

export const AnalystActions = (props: {
  id: number;
  status: ModelYearReportStatus;
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleReturnToSupplier = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        await handleReturns(
          props.id,
          ModelYearReportStatus.RETURNED_TO_SUPPLIER,
          getNormalizedComment(comment),
        );
        router.refresh();
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, [props.id, comment, router]);

  const handleGoToConductAssessment = useCallback(() => {
    router.push(`${Routes.ComplianceReporting}/${props.id}/assessment`);
  }, [props.id, router]);

  if (
    props.status !== ModelYearReportStatus.SUBMITTED_TO_GOVERNMENT &&
    props.status !== ModelYearReportStatus.RETURNED_TO_ANALYST
  ) {
    return null;
  }
  return (
    <div className="space-y-2">
      {error && <p className="text-red-600">{error}</p>}
      <CommentBox
        comment={comment}
        setComment={setComment}
        disabled={isPending}
      />
      <Button onClick={handleReturnToSupplier} disabled={isPending}>
        {isPending ? "..." : "Return To Supplier"}
      </Button>
      <Button onClick={handleGoToConductAssessment} disabled={isPending}>
        {isPending ? "..." : "Conduct Assessment"}
      </Button>
    </div>
  );
};
