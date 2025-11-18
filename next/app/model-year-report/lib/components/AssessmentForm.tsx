"use client";

import axios from "axios";
import {
  ModelYear,
  ModelYearReportStatus,
  TransactionType,
  VehicleClass,
  ZevClass,
} from "@/prisma/generated/client";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import {
  getAssessmentData,
  getAssessmentTemplateUrl,
  NvValues,
  submitAssessment,
  submitReassessment,
} from "../actions";
import { getModelYearEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { MyrNvValues } from "./MyrNvValues";
import { Button } from "@/app/lib/components";
import {
  generateAssessment,
  getAdjustmentsPayload,
  validateNvValues,
} from "../utilsClient";
import { bytesToBase64 } from "@/app/lib/utils/base64";
import { Adjustment, Adjustments } from "./Adjustments";
import { CommentBox } from "@/app/lib/components/inputs/CommentBox";
import { Routes } from "@/app/lib/constants";
import { getNormalizedComment } from "@/app/credit-application/lib/utils";
import { Workbook } from "exceljs";
import { parseAssessment, ParsedAssmnt } from "../utils";
import { ParsedAssessment } from "./ParsedAssessment";

export const AssessmentForm = (props: {
  myrId: number;
  orgId: number;
  orgName: string;
  status: ModelYearReportStatus;
  modelYear: ModelYear;
  isReassessment: boolean;
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");
  const [nvValues, setNvValues] = useState<NvValues>({});
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [assessment, setAssessment] = useState<[Workbook, ParsedAssmnt] | null>(
    null,
  );
  const [comment, setComment] = useState<string>("");

  const modelYearsMap = useMemo(() => {
    return getModelYearEnumsToStringsMap();
  }, []);

  const addAdjustment = useCallback(() => {
    setAdjustments((prev) => {
      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: TransactionType.CREDIT,
          vehicleClass: VehicleClass.REPORTABLE,
          zevClass: ZevClass.A,
          modelYear: props.modelYear,
          numberOfUnits: "0",
        },
      ];
    });
  }, [props.modelYear]);

  const removeAdjustment = useCallback((id: string) => {
    setAdjustments((prev) => {
      return prev.filter((adjustment) => adjustment.id !== id);
    });
  }, []);

  const handleAdjustmentChange = useCallback(
    (id: string, key: string, value: string) => {
      setAdjustments((prev) => {
        return prev.map((adjustment) => {
          if (adjustment.id === id) {
            return { ...adjustment, [key]: value };
          }
          return adjustment;
        });
      });
    },
    [],
  );

  const handleNvValuesChange = useCallback(
    (key: VehicleClass, value: string) => {
      setNvValues((prev) => {
        return { ...prev, [key]: value };
      });
    },
    [],
  );

  const handleGenerateAssessment = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        if (props.isReassessment) {
          validateNvValues(nvValues);
        }
        const adjustmentsPayload = getAdjustmentsPayload(adjustments);
        const [templateUrl, assessmentResponse] = await Promise.all([
          getAssessmentTemplateUrl(),
          getAssessmentData(
            props.myrId,
            adjustmentsPayload,
            props.isReassessment,
            props.isReassessment ? nvValues : undefined,
          ),
        ]);
        if (assessmentResponse.responseType === "error") {
          throw new Error(assessmentResponse.message);
        }
        const templateResponse = await axios.get(templateUrl, {
          responseType: "arraybuffer",
        });
        const template = templateResponse.data;
        const assessment = await generateAssessment(
          template,
          assessmentResponse.data,
          adjustmentsPayload,
        );
        const parsedAssessment = parseAssessment(assessment);
        setAssessment([assessment, parsedAssessment]);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, [props.myrId, props.isReassessment, nvValues, adjustments]);

  const handleClearAssessment = useCallback(() => {
    setError("");
    setAssessment(null);
  }, []);

  const handleSubmit = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        if (assessment === null) {
          throw new Error("Exactly 1 valid Assessment expected!");
        }
        let submitResponse;
        const assessmentBase64 = bytesToBase64(
          await assessment[0].xlsx.writeBuffer(),
        );
        if (props.isReassessment) {
          submitResponse = await submitReassessment(
            props.orgId,
            props.modelYear,
            assessmentBase64,
            getNormalizedComment(comment),
          );
        } else {
          submitResponse = await submitAssessment(
            props.myrId,
            assessmentBase64,
            getNormalizedComment(comment),
          );
        }
        if (submitResponse.responseType === "error") {
          throw new Error(submitResponse.message);
        }
        router.push(`${Routes.ComplianceReporting}/${props.myrId}`);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, [assessment, props.myrId, props.orgId, props.modelYear, comment]);

  return (
    <div>
      <div className="flex items-center py-2 my-2">
        <label className="w-72" htmlFor="modelYear">
          Model Year
        </label>
        <input
          disabled={true}
          name="modelYear"
          type="text"
          value={modelYearsMap[props.modelYear]}
          className="border p-2 w-full"
        />
      </div>
      {props.isReassessment && !assessment && (
        <MyrNvValues
          nvValues={nvValues}
          handleChange={handleNvValuesChange}
          disabled={isPending}
        />
      )}
      {!assessment && (
        <Adjustments
          adjustments={adjustments}
          addAdjustment={addAdjustment}
          removeAdjustment={removeAdjustment}
          handleAdjustmentChange={handleAdjustmentChange}
          disabled={isPending}
        />
      )}
      <div className="flex space-x-2">
        {assessment ? (
          <Button onClick={handleClearAssessment} disabled={isPending}>
            {isPending
              ? "..."
              : `Clear ${props.isReassessment ? "Rea" : "A"}ssessment`}
          </Button>
        ) : (
          <Button onClick={handleGenerateAssessment} disabled={isPending}>
            {isPending
              ? "..."
              : `Generate ${props.isReassessment ? "Rea" : "A"}ssessment`}
          </Button>
        )}
      </div>
      {assessment && <ParsedAssessment assessment={assessment[1]} />}
      <CommentBox
        comment={comment}
        setComment={setComment}
        disabled={isPending}
      />
      {error && <p className="text-red-600">{error}</p>}
      <div className="flex space-x-2">
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending ? "..." : "Submit to Director"}
        </Button>
      </div>
    </div>
  );
};
