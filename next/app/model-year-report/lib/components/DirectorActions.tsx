"use client";

import axios from "axios";
import { Button } from "@/app/lib/components";
import { ModelYear, ModelYearReportStatus } from "@/prisma/generated/client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  directorAssess,
  getDownloadAssessmentUrl,
  handleReturns,
} from "../actions";
import { getNormalizedComment } from "@/app/credit-application/lib/utils";
import { CommentBox } from "@/app/lib/components/inputs/CommentBox";
import { AssessmentResult, AssessmentResultData } from "./AssessmentResult";
import { getAssessmentPayload, parseAssessment } from "../utilsClient";

export const DirectorActions = (props: {
  id: number;
  status: ModelYearReportStatus;
  modelYear: ModelYear;
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
        const response = await getDownloadAssessmentUrl(props.id);
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
  }, [props.id, props.modelYear]);

  const handleReturnToAnalyst = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        await handleReturns(
          props.id,
          ModelYearReportStatus.RETURNED_TO_ANALYST,
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

  const handleIssueAssessment = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        if (assessmentResult) {
          const payload = getAssessmentPayload(assessmentResult);
          await directorAssess(props.id, payload, comment);
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
  }, [props.id, assessmentResult, comment, router]);

  if (props.status !== ModelYearReportStatus.SUBMITTED_TO_DIRECTOR) {
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
        {isPending ? "..." : "Issue Assessment"}
      </Button>
    </div>
  );
};
