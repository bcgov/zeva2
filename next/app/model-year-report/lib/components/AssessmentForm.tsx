"use client";

import axios from "axios";
import {
  ModelYear,
  TransactionType,
  VehicleClass,
  ZevClass,
} from "@/prisma/generated/client";
import { useRouter } from "next/navigation";
import { JSX, useCallback, useMemo, useState, useTransition } from "react";
import {
  AssessmentArgs,
  getAssessmentData,
  getAssessmentTemplateUrl,
  LegacyReassessmentArgs,
  NonLegacyReassessmentArgs,
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
import { getNormalizedComment } from "@/app/lib/utils/comment";
import { Workbook } from "exceljs";
import { parseAssessment, ParsedAssmnt } from "../utils";
import { ParsedAssessment } from "./ParsedAssessment";
import { isModelYear } from "@/app/lib/utils/typeGuards";

type AssessmentProps = {
  assessmentType: "assessment";
  myrId: number;
  modelYear: ModelYear;
};

type LegacyReassessmentProps = {
  assessmentType: "legacyReassessment";
  orgsMap: Partial<Record<number, string>>;
};

type NonLegacyReassessmentProps = {
  assessmentType: "nonLegacyReassessment";
  myrId: number;
  orgId: number;
  modelYear: ModelYear;
};

export const AssessmentForm = (
  props: AssessmentProps | LegacyReassessmentProps | NonLegacyReassessmentProps,
) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");
  const [selectedOrgId, setSelectedOrgId] = useState<number | undefined>();
  const [selectedModelYear, setSelectedModelYear] = useState<
    ModelYear | undefined
  >();
  const [nvValues, setNvValues] = useState<NvValues>({});
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [assessment, setAssessment] = useState<[Workbook, ParsedAssmnt] | null>(
    null,
  );
  const [comment, setComment] = useState<string>("");

  const modelYearsMap = useMemo(() => {
    return getModelYearEnumsToStringsMap();
  }, []);

  const legacyModelYearsMap: Partial<Record<string, ModelYear>> =
    useMemo(() => {
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
    let defaultModelYear;
    if (props.assessmentType === "legacyReassessment") {
      if (selectedModelYear) {
        defaultModelYear = selectedModelYear;
      } else {
        defaultModelYear = ModelYear.MY_2024;
      }
    } else {
      defaultModelYear = props.modelYear;
    }
    setAdjustments((prev) => {
      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: TransactionType.CREDIT,
          vehicleClass: VehicleClass.REPORTABLE,
          zevClass: ZevClass.A,
          modelYear: defaultModelYear,
          numberOfUnits: "0",
        },
      ];
    });
  }, [props, selectedModelYear]);

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
        if (props.assessmentType !== "assessment") {
          validateNvValues(nvValues);
        }
        const adjustmentsPayload = getAdjustmentsPayload(adjustments);
        let getDataArgs:
          | AssessmentArgs
          | LegacyReassessmentArgs
          | NonLegacyReassessmentArgs;
        if (props.assessmentType === "assessment") {
          getDataArgs = {
            assessmentType: "assessment",
            myrId: props.myrId,
            adjustments: adjustmentsPayload,
          };
        } else if (props.assessmentType === "legacyReassessment") {
          if (!selectedOrgId || !selectedModelYear) {
            throw new Error("Invalid supplier or model year!");
          }
          getDataArgs = {
            assessmentType: "legacyReassessment",
            orgId: selectedOrgId,
            modelYear: selectedModelYear,
            adjustments: adjustmentsPayload,
            nvValues,
          };
        } else {
          getDataArgs = {
            assessmentType: "nonLegacyReassessment",
            myrId: props.myrId,
            adjustments: adjustmentsPayload,
            nvValues,
          };
        }
        const [templateUrl, assessmentResponse] = await Promise.all([
          getAssessmentTemplateUrl(),
          getAssessmentData(getDataArgs),
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
  }, [props, selectedOrgId, selectedModelYear, nvValues, adjustments]);

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
        if (props.assessmentType === "assessment") {
          submitResponse = await submitAssessment(
            props.myrId,
            assessmentBase64,
            getNormalizedComment(comment),
          );
        } else if (props.assessmentType === "legacyReassessment") {
          if (!selectedOrgId || !selectedModelYear) {
            throw new Error("Invalid supplier or model year!");
          }
          submitResponse = await submitReassessment(
            selectedOrgId,
            selectedModelYear,
            assessmentBase64,
            getNormalizedComment(comment),
          );
        } else {
          submitResponse = await submitReassessment(
            props.orgId,
            props.modelYear,
            assessmentBase64,
            getNormalizedComment(comment),
          );
        }
        if (submitResponse.responseType === "error") {
          throw new Error(submitResponse.message);
        }
        if (submitResponse.responseType === "data") {
          const reassessmentId = submitResponse.data;
          if (props.assessmentType === "legacyReassessment") {
            router.push(`${Routes.LegacyReassessments}/${reassessmentId}`);
          } else {
            router.push(
              `${Routes.ComplianceReporting}/${props.myrId}/reassessment/${reassessmentId}`,
            );
          }
        } else if (props.assessmentType === "assessment") {
          router.push(`${Routes.ComplianceReporting}/${props.myrId}`);
        }
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, [props, selectedOrgId, selectedModelYear, assessment, comment]);

  const handleOrgSelect = useCallback(
    (selectedOrgId: string) => {
      if (props.assessmentType === "legacyReassessment") {
        const orgIdNumber = Number.parseInt(selectedOrgId, 10);
        if (props.orgsMap[orgIdNumber]) {
          setSelectedOrgId(orgIdNumber);
        } else {
          setSelectedOrgId(undefined);
        }
      }
    },
    [props],
  );

  const orgsComponent: JSX.Element | null = useMemo(() => {
    if (props.assessmentType === "legacyReassessment" && !assessment) {
      return (
        <div className="flex items-center py-2 my-2">
          <label className="w-72" htmlFor="orgs">
            Supplier
          </label>
          <select
            name="orgs"
            value={selectedOrgId}
            className="border p-2 w-full"
            onChange={(e) => {
              handleOrgSelect(e.target.value);
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
      );
    }
    return null;
  }, [props, selectedOrgId, assessment, handleOrgSelect]);

  const modelYearComponent: JSX.Element | null = useMemo(() => {
    if (props.assessmentType === "legacyReassessment") {
      if (assessment) {
        return null;
      }
      return (
        <div className="flex items-center py-2 my-2">
          <label className="w-72" htmlFor="modelYear">
            Model Year
          </label>
          <select
            name="modelYear"
            value={selectedModelYear}
            className="border p-2 w-full"
            onChange={(e) => {
              const value = e.target.value;
              setSelectedModelYear(isModelYear(value) ? value : undefined);
            }}
          >
            <option key={undefined}>--</option>
            {Object.entries(legacyModelYearsMap).map(([key, value]) => (
              <option key={key} value={value}>
                {key}
              </option>
            ))}
          </select>
        </div>
      );
    }
    return (
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
    );
  }, [
    props,
    selectedModelYear,
    modelYearsMap,
    legacyModelYearsMap,
    assessment,
  ]);

  return (
    <div>
      {orgsComponent}
      {modelYearComponent}
      {props.assessmentType !== "assessment" && !assessment && (
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
          <Button
            variant="tertiary"
            size="small"
            onClick={handleClearAssessment}
            disabled={isPending}
          >
            {isPending
              ? "..."
              : `Clear ${props.assessmentType === "assessment" ? "Assessment" : "Reassessment"}`}
          </Button>
        ) : (
          <Button
            variant="secondary"
            onClick={handleGenerateAssessment}
            disabled={isPending}
          >
            {isPending
              ? "..."
              : `Generate ${props.assessmentType === "assessment" ? "Assessment" : "Reassessment"}`}
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
        <Button variant="primary" onClick={handleSubmit} disabled={isPending}>
          {isPending ? "..." : "Submit to Director"}
        </Button>
      </div>
    </div>
  );
};
