"use client";

import { Button } from "@/app/lib/components";
import { Routes } from "@/app/lib/constants";
import { ModelYearReportStatus } from "@/prisma/generated/client";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { returnModelYearReport } from "../actions";
import { getNormalizedComment } from "@/app/credit-application/lib/utils";
import { CommentBox } from "@/app/lib/components/inputs/CommentBox";

export const AnalystActions = (props: {
  id: number;
  status: ModelYearReportStatus;
  canConductReassessment: boolean;
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleReturnToSupplier = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        await returnModelYearReport(
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
  }, [props.id, comment]);

  const handleGoToConductAssessment = useCallback(() => {
    router.push(`${Routes.ComplianceReporting}/${props.id}/assessment`);
  }, [props.id]);

  const handleGoToConductReassessment = useCallback(() => {
    router.push(`${Routes.ComplianceReporting}/${props.id}/reassessment`);
  }, [props.id]);

  if (
    props.status === ModelYearReportStatus.RETURNED_TO_SUPPLIER ||
    props.status === ModelYearReportStatus.SUBMITTED_TO_DIRECTOR
  ) {
    return null;
  }
  return (
    <div className="space-y-2">
      {error && <p className="text-red-600">{error}</p>}
      {!props.canConductReassessment &&
        props.status !== ModelYearReportStatus.ASSESSED && (
          <>
            <CommentBox
              comment={comment}
              setComment={setComment}
              disabled={isPending}
            />
            <Button variant="secondary" onClick={handleReturnToSupplier} disabled={isPending}>
              {isPending ? "..." : "Return To Supplier"}
            </Button>
            <Button variant="primary" onClick={handleGoToConductAssessment} disabled={isPending}>
              {isPending ? "..." : "Conduct Assessment"}
            </Button>
          </>
        )}
      {props.canConductReassessment && (
        <Button variant="primary" onClick={handleGoToConductReassessment} disabled={isPending}>
          {isPending ? "..." : "Conduct Reassessment"}
        </Button>
      )}
    </div>
  );
};
