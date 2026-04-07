"use client";

import { Button } from "@/app/lib/components";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { getNormalizedComment } from "@/app/lib/utils/comment";
import { Textarea } from "@/app/lib/components/inputs/Textarea";
import { ModelYearReportStatus } from "@/prisma/generated/enums";
import { Routes } from "@/app/lib/constants";
import {
  returnSupplementaryToSupplier,
  submitSupplementaryToDirector,
} from "../actions";

// if myrId is undefined, then we're dealing with a legacy supplementary;
// otherwise, we're dealing with a non-legacy supplementary
export const SupplementaryAnalystActions = (props: {
  suppId: number;
  status: ModelYearReportStatus;
  suppReassessmentExists: boolean;
  myrId?: number;
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleReturnToSupplier = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        const response = await returnSupplementaryToSupplier(
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

  const handleSubmitToDirector = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        const response = await submitSupplementaryToDirector(
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

  const handleGoToCreateSuppReassessment = useCallback(() => {
    if (props.myrId) {
      router.push(
        `${Routes.ComplianceReporting}/${props.myrId}/supplementary/${props.suppId}/reassessment`,
      );
    } else {
      router.push(`${Routes.LegacySupplementary}/${props.suppId}/reassessment`);
    }
  }, [props.myrId, props.suppId]);

  const handleGoToEditSuppReassessment = useCallback(() => {
    if (props.myrId) {
      router.push(
        `${Routes.ComplianceReporting}/${props.myrId}/supplementary/${props.suppId}/reassessment/edit`,
      );
    } else {
      router.push(
        `${Routes.LegacySupplementary}/${props.suppId}/reassessment/edit`,
      );
    }
  }, [props.myrId, props.suppId]);

  if (
    props.status === ModelYearReportStatus.SUBMITTED_TO_GOVERNMENT ||
    props.status === ModelYearReportStatus.RETURNED_TO_ANALYST
  ) {
    return (
      <div>
        {error && <p className="text-red-600">{error}</p>}
        <Textarea value={comment} onChange={setComment} disabled={isPending} />
        <Button
          variant="secondary"
          onClick={handleReturnToSupplier}
          disabled={isPending}
        >
          {isPending ? "..." : "Return To Supplier"}
        </Button>
        {props.suppReassessmentExists ? (
          <>
            <Button
              variant="secondary"
              onClick={handleGoToEditSuppReassessment}
              disabled={isPending}
            >
              {isPending ? "..." : "Edit Associated Reassessment"}
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmitToDirector}
              disabled={isPending}
            >
              {isPending ? "..." : "Submit to Director"}
            </Button>
          </>
        ) : (
          <Button
            variant="primary"
            onClick={handleGoToCreateSuppReassessment}
            disabled={isPending}
          >
            {isPending ? "..." : "Create Associated Reassessment"}
          </Button>
        )}
      </div>
    );
  }
  return null;
};
