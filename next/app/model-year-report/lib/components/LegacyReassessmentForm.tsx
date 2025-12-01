"use client";

import axios from "axios";
import {
  ModelYear,
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
  submitReassessment,
} from "../actions";
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
import { isModelYear } from "@/app/lib/utils/typeGuards";

export const LegacyReassessmentForm = (props: {
  orgsMap: Partial<Record<number, string>>;
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");
  const [orgId, setOrgId] = useState<number | undefined>();
  const [modelYear, setModelYear] = useState<ModelYear | undefined>();
  const [nvValues, setNvValues] = useState<NvValues>({});
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [assessment, setAssessment] = useState<[Workbook, ParsedAssmnt] | null>(
    null,
  );
  const [comment, setComment] = useState<string>("");

  const modelYearsMap: Partial<Record<string, ModelYear>> = useMemo(() => {
    return {
      "2019": ModelYear.MY_2019,
      "2020": ModelYear.MY_2020,
      "2021": ModelYear.MY_2021,
      "2022": ModelYear.MY_2022,
      "2023": ModelYear.MY_2023,
      "2024": ModelYear.MY_2024,
    };
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
          modelYear: modelYear ? modelYear : ModelYear.MY_2024,
          numberOfUnits: "0",
        },
      ];
    });
  }, [modelYear]);

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
        if (orgId === undefined || !modelYear) {
          throw new Error("Invalid supplier or model year!");
        }
        console.log(orgId);
        console.log(modelYear);
        validateNvValues(nvValues);
        const adjustmentsPayload = getAdjustmentsPayload(adjustments);
        const [templateUrl, assessmentResponse] = await Promise.all([
          getAssessmentTemplateUrl(),
          getAssessmentData({
            assessmentType: "legacyReassessment",
            orgId,
            modelYear,
            adjustments: adjustmentsPayload,
            nvValues,
          }),
        ]);
        if (assessmentResponse.responseType === "error") {
          throw new Error(assessmentResponse.message);
        }
        const templateResponse = await axios.get(templateUrl, {
          responseType: "arraybuffer",
        });
        const template = templateResponse.data;
        console.log(assessmentResponse.data);
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
  }, [orgId, modelYear, nvValues, adjustments]);

  const handleClearAssessment = useCallback(() => {
    setError("");
    setAssessment(null);
  }, []);

  const handleSubmit = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        if (orgId === undefined || !modelYear) {
          throw new Error("Invalid supplier or model year!");
        }
        if (assessment === null) {
          throw new Error("Exactly 1 valid Assessment expected!");
        }
        const assessmentBase64 = bytesToBase64(
          await assessment[0].xlsx.writeBuffer(),
        );
        const response = await submitReassessment(
          orgId,
          modelYear,
          assessmentBase64,
          getNormalizedComment(comment),
        );
        if (response.responseType === "error") {
          throw new Error(response.message);
        }
        router.push(`${Routes.LegacyReassessments}/${response.data}`);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, [modelYear, assessment, comment]);

  return (
    <div>
      {!assessment && (
        <div className="flex items-center py-2 my-2">
          <label className="w-72" htmlFor="orgs">
            Supplier
          </label>
          <select
            name="orgs"
            value={orgId}
            className="border p-2 w-full"
            onChange={(e) => {
              const orgIdNumber = parseInt(e.target.value, 10);
              if (props.orgsMap[orgIdNumber]) {
                setOrgId(orgIdNumber);
              } else {
                setOrgId(undefined);
              }
            }}
          >
            <option key={undefined}>--</option>
            {Object.entries(props.orgsMap).map(([key, value]) => (
              <option key={key} value={key}>
                {value}
              </option>
            ))}
          </select>
        </div>
      )}
      {!assessment && (
        <div className="flex items-center py-2 my-2">
          <label className="w-72" htmlFor="modelYear">
            Model Year
          </label>
          <select
            name="modelYear"
            value={modelYear}
            className="border p-2 w-full"
            onChange={(e) => {
              const value = e.target.value;
              setModelYear(isModelYear(value) ? value : undefined);
            }}
          >
            <option key={undefined}>--</option>
            {Object.entries(modelYearsMap).map(([key, value]) => (
              <option key={key} value={value}>
                {key}
              </option>
            ))}
          </select>
        </div>
      )}
      <MyrNvValues
        nvValues={nvValues}
        handleChange={handleNvValuesChange}
        disabled={isPending}
      />
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
            {isPending ? "..." : "Clear Reassessment"}
          </Button>
        ) : (
          <Button onClick={handleGenerateAssessment} disabled={isPending}>
            {isPending ? "..." : "Generate Reassessment"}
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
