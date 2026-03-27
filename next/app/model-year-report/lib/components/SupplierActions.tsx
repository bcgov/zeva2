"use client";

import { Button } from "@/app/lib/components";
import { Textarea } from "@/app/lib/components/inputs/Textarea";
import { Routes } from "@/app/lib/constants";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { deleteReports, submitReports } from "../actions";
import { getNormalizedComment } from "@/app/lib/utils/comment";
import { ModelYearReportStatus } from "@/prisma/generated/enums";

export const SupplierActions = (props: {
  myrId: number;
  status: ModelYearReportStatus;
  canCreateSupplementary: boolean;
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleDelete = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        const response = await deleteReports(props.myrId);
        if (response.responseType === "error") {
          throw new Error(response.message);
        }
        router.push(Routes.ComplianceReporting);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, [props.myrId]);

  const handleGoToEdit = useCallback(() => {
    router.push(`${Routes.ComplianceReporting}/${props.myrId}/edit`);
  }, [props.myrId]);

  const handleGoToCreateSupplementary = useCallback(() => {
    router.push(`${Routes.ComplianceReporting}/${props.myrId}/supplementary`);
  }, [props.myrId]);

  const handleSubmit = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        const response = await submitReports(
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
  }, [props.myrId]);

  if (
    props.status === ModelYearReportStatus.DRAFT ||
    props.status === ModelYearReportStatus.RETURNED_TO_SUPPLIER
  ) {
    return (
      <div className="space-y-2">
        {error && <p className="text-red-600">{error}</p>}
        <Textarea
          value={comment}
          onChange={setComment}
          disabled={isPending}
        />
        <Button variant="secondary" onClick={handleDelete}>
          Delete
        </Button>
        <Button variant="secondary" onClick={handleGoToEdit}>
          Edit
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          Submit
        </Button>
      </div>
    );
  } else if (props.canCreateSupplementary) {
    return (
      <div className="space-y-2">
        <Button variant="primary" onClick={handleGoToCreateSupplementary}>
          Create Supplementary Report
        </Button>
      </div>
    );
  }
  return null;
};
