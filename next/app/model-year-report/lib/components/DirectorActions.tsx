"use client";

import axios from "axios";
import { Button } from "@/app/lib/components";
import { ModelYear, ModelYearReportStatus } from "@/prisma/generated/client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  directorAssess,
  directorReassess,
  getDownloadAssessmentUrl,
  getDownloadLatestReassessmentUrl,
  handleReturns,
  returnReassessment,
} from "../actions";
import { getNormalizedComment } from "@/app/credit-application/lib/utils";
import { CommentBox } from "@/app/lib/components/inputs/CommentBox";
import { AssessmentResult, AssessmentResultData } from "./AssessmentResult";
import { getAssessmentPayload, parseAssessment } from "../utilsClient";

export const DirectorActions = (props: {
  id: number;
  organizationId: number;
  modelYear: ModelYear;
  status: ModelYearReportStatus;
  assessableReassessmentId: number | null;
}) => {
  const router = useRouter();
  const [assessmentResult, setAssessmentResult] = useState<
    AssessmentResultData | undefined
  >();
  const [isPending, startTransition] = useTransition();
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    startTransition(async () => {
      try {
        let response;
        if (props.assessableReassessmentId === null) {
          response = await getDownloadAssessmentUrl(props.id);
        } else {
          response = await getDownloadLatestReassessmentUrl(
            props.organizationId,
            props.modelYear,
          );
        }
        if (response.responseType === "error") {
          throw new Error(response.message);
        }
        const url = response.data;
        const assessment = await axios.get(url, {
          responseType: "arraybuffer",
        });
        const result = await parseAssessment(assessment.data, props.modelYear);
        setAssessmentResult(result);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, [
    props.id,
    props.status,
    props.organizationId,
    props.assessableReassessmentId,
    props.modelYear,
  ]);

  const handleReturnToAnalyst = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        if (props.assessableReassessmentId === null) {
          await handleReturns(
            props.id,
            ModelYearReportStatus.RETURNED_TO_ANALYST,
            getNormalizedComment(comment),
          );
        } else {
          await returnReassessment(
            props.assessableReassessmentId,
            getNormalizedComment(comment),
          );
        }
        router.refresh();
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, [props.id, props.status, props.assessableReassessmentId, comment]);

  const handleIssueAssessment = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        if (assessmentResult) {
          const payload = getAssessmentPayload(assessmentResult);
          if (props.assessableReassessmentId === null) {
            await directorAssess(
              props.id,
              payload,
              getNormalizedComment(comment),
            );
          } else {
            directorReassess(
              props.assessableReassessmentId,
              payload,
              getNormalizedComment(comment),
            );
          }
          router.refresh();
        } else {
          throw new Error("No assessment result!");
        }
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, [props.id, assessmentResult, comment]);

  if (
    props.status !== ModelYearReportStatus.SUBMITTED_TO_DIRECTOR &&
    props.assessableReassessmentId === null
  ) {
    return null;
  }
  return (
    <div className="space-y-2">
      {error && <p className="text-red-600">{error}</p>}
      <AssessmentResult
        data={assessmentResult}
        complianceYear={props.modelYear}
      />
      <CommentBox
        comment={comment}
        setComment={setComment}
        disabled={isPending}
      />
      <Button onClick={handleReturnToAnalyst} disabled={isPending}>
        {isPending ? "..." : "Return To Analyst"}
      </Button>
      <Button onClick={handleIssueAssessment} disabled={isPending}>
        {isPending
          ? "..."
          : `Issue ${props.assessableReassessmentId === null ? "A" : "Rea"}ssessment`}
      </Button>
    </div>
  );
};
