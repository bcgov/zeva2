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
import { SupplierZevClassChoice } from "../constants";
import {
  getAssessmentData,
  getAssessmentTemplateUrl,
  NvValues,
  submitAssessment,
  submitReassessment,
} from "../actions";
import { getModelYearEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { MyrNvValues } from "./MyrNvValues";
import { ZevClassSelect } from "./ZevClassSelect";
import { Button } from "@/app/lib/components";
import {
  generateAssessment,
  getAdjustmentsPayload,
  getZevClassOrdering,
  parseAssessment,
  validateNvValues,
} from "../utilsClient";
import { bytesToBase64 } from "@/app/lib/utils/base64";
import { Adjustment, Adjustments } from "./Adjustments";
import { AssessmentResult, AssessmentResultData } from "./AssessmentResult";
import { CommentBox } from "@/app/lib/components/inputs/CommentBox";
import { Routes } from "@/app/lib/constants";
import { getNormalizedComment } from "@/app/credit-application/lib/utils";
import { Workbook } from "exceljs";

export const AssessmentForm = (props: {
  id: number;
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
  const [zevClassSelection, setZevClassSelection] =
    useState<SupplierZevClassChoice>(ZevClass.B);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [assessment, setAssessment] = useState<Workbook | null>(null);
  const [assessmentResult, setAssessmentResult] = useState<
    AssessmentResultData | undefined
  >();
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

  const handleZevClassSelect = useCallback(
    (zevClass: SupplierZevClassChoice) => {
      setZevClassSelection(zevClass);
    },
    [],
  );

  const handleGenerateAssessment = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        validateNvValues(nvValues);
        const zevClassOrdering = getZevClassOrdering(zevClassSelection);
        const adjustmentsPayload = getAdjustmentsPayload(adjustments);
        const [templateUrl, assessmentResponse] = await Promise.all([
          getAssessmentTemplateUrl(),
          getAssessmentData(
            props.orgId,
            props.modelYear,
            nvValues,
            zevClassOrdering,
            adjustmentsPayload,
            props.isReassessment,
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
          zevClassSelection,
          adjustmentsPayload,
          props.orgName,
          props.modelYear,
        );
        const assessmentResult = parseAssessment(assessment, props.modelYear);
        setAssessment(assessment);
        setAssessmentResult(assessmentResult);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, [
    props.orgId,
    props.orgName,
    props.modelYear,
    props.isReassessment,
    nvValues,
    zevClassSelection,
    adjustments,
  ]);

  const handleSubmit = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        if (assessment === null) {
          throw new Error("Exactly 1 valid Assessment expected!");
        }
        let submitResponse;
        const assessmentBase64 = bytesToBase64(
          await assessment.xlsx.writeBuffer(),
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
            props.id,
            assessmentBase64,
            getNormalizedComment(comment),
          );
        }
        if (submitResponse.responseType === "error") {
          throw new Error(submitResponse.message);
        }
        router.push(`${Routes.ComplianceReporting}/${props.id}`);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, [
    assessment,
    assessmentResult,
    props.id,
    props.orgId,
    props.modelYear,
    comment,
  ]);

  return (
    <div>
      {error && <p className="text-red-600">{error}</p>}
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
      <MyrNvValues
        nvValues={nvValues}
        handleChange={handleNvValuesChange}
        disabled={isPending}
      />
      <div className="flex items-center py-2 my-2">
        <p>
          Select the ZEV class of credits that should be used first when
          offsetting debits of the unspecified ZEV class:
        </p>
      </div>
      <div className="flex items-center py-2 my-2 space-x-4">
        <ZevClassSelect
          zevClassSelection={zevClassSelection}
          handleChange={handleZevClassSelect}
          disabled={isPending}
        />
      </div>
      <Adjustments
        adjustments={adjustments}
        addAdjustment={addAdjustment}
        removeAdjustment={removeAdjustment}
        handleAdjustmentChange={handleAdjustmentChange}
        disabled={isPending}
      />
      <div className="flex space-x-2">
        <Button onClick={handleGenerateAssessment} disabled={isPending}>
          {isPending
            ? "..."
            : `Generate and Download ${props.isReassessment ? "Rea" : "A"}ssessment`}
        </Button>
      </div>
      <div className="flex flex-col items-center space-x-4">
        <AssessmentResult
          data={assessmentResult}
          complianceYear={props.modelYear}
        />
      </div>
      <CommentBox
        comment={comment}
        setComment={setComment}
        disabled={isPending}
      />
      <div className="flex space-x-2">
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending ? "..." : "Submit to Director"}
        </Button>
      </div>
    </div>
  );
};
