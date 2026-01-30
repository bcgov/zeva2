"use client";

import axios from "axios";
import {
  ModelYear,
  TransactionType,
  VehicleClass,
  ZevClass,
} from "@/prisma/generated/client";
import { useRouter } from "next/navigation";
import {
  JSX,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import {
  createOrSaveAssessment,
  createReassessment,
  getAssessmentData,
  getAssessmentTemplateUrl,
  NvValues,
  saveReassessment,
} from "../actions";
import { getModelYearEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { MyrNvValues } from "./MyrNvValues";
import { Button } from "@/app/lib/components";
import {
  generateAssessment,
  getAdjustmentsPayload,
  getZevClassOrdering,
  validateNvValues,
} from "../utilsClient";
import { bytesToBase64 } from "@/app/lib/utils/base64";
import { Adjustment, Adjustments } from "./Adjustments";
import { Routes } from "@/app/lib/constants";
import { Workbook } from "exceljs";
import { parseAssessment, ParsedAssmnt } from "../utils";
import { ParsedAssessment } from "./ParsedAssessment";
import { isModelYear } from "@/app/lib/utils/typeGuards";
import { legacyModelYearsMap, SupplierZevClassChoice } from "../constants";
import { ZevClassSelect } from "./ZevClassSelect";

// for new/saved assessments, and new non-legacy reassessments
type GeneralProps = {
  type: "assessment" | "nonLegacyNewReassment";
  orgName: string;
  modelYear: ModelYear;
  orgId: number;
  myrId: number;
};

type LegacyNewReassessmentProps = {
  type: "legacyNewReassessment";
  orgsMap: Partial<Record<number, string>>;
};

type SavedReassessmentProps = {
  type: "savedReassessment";
  reassessmentId: number;
  orgName: string;
  modelYear: ModelYear;
};

export const AssessmentForm = (
  props: GeneralProps | LegacyNewReassessmentProps | SavedReassessmentProps,
) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");
  const [orgId, setOrgId] = useState<number>();
  const [modelYear, setModelYear] = useState<ModelYear>();
  const [nvValues, setNvValues] = useState<NvValues>({});
  const [zevClassSelection, setZevClassSelection] =
    useState<SupplierZevClassChoice>(ZevClass.B);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [assessment, setAssessment] = useState<[Workbook, ParsedAssmnt] | null>(
    null,
  );

  useEffect(() => {
    if (props.type === "assessment" || props.type === "nonLegacyNewReassment") {
      setOrgId(props.orgId);
    }
    if (props.type !== "legacyNewReassessment") {
      setModelYear(props.modelYear);
    }
  }, [props]);

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
          modelYear,
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
        if (!orgId || !modelYear) {
          throw new Error("Supplier and Model Year are required!");
        }
        let nvValuesToUse;
        let zevClassOrdering;
        if (props.type !== "assessment") {
          validateNvValues(nvValues);
          nvValuesToUse = nvValues;
          zevClassOrdering = getZevClassOrdering(zevClassSelection);
        }
        const adjustmentsPayload = getAdjustmentsPayload(adjustments);
        const [templateUrl, assessmentResponse] = await Promise.all([
          getAssessmentTemplateUrl(),
          getAssessmentData(
            props.type === "assessment" ? "assessment" : "reassessment",
            orgId,
            modelYear,
            adjustmentsPayload,
            nvValuesToUse,
            zevClassOrdering,
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
  }, [props.type, orgId, modelYear, nvValues, adjustments]);

  const handleClearAssessment = useCallback(() => {
    setError("");
    setAssessment(null);
  }, []);

  const handleSave = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        if (assessment === null) {
          throw new Error("Exactly 1 valid Assessment/Reassessment expected!");
        }
        let response;
        const assessmentBase64 = bytesToBase64(
          await assessment[0].xlsx.writeBuffer(),
        );
        if (props.type === "assessment") {
          response = await createOrSaveAssessment(
            props.myrId,
            assessmentBase64,
          );
        } else if (
          props.type === "legacyNewReassessment" ||
          props.type === "nonLegacyNewReassment"
        ) {
          if (!orgId || !modelYear) {
            throw new Error("Invalid supplier or model year!");
          }
          response = await createReassessment(
            orgId,
            modelYear,
            assessmentBase64,
          );
        } else if (props.type === "savedReassessment") {
          response = await saveReassessment(
            props.reassessmentId,
            assessmentBase64,
          );
        }
        if (!response) {
          throw new Error("Unexpected Error!");
        }
        if (response.responseType === "error") {
          throw new Error(response.message);
        }
        if (props.type === "assessment") {
          router.push(`${Routes.ComplianceReporting}/${props.myrId}`);
        } else if (response.responseType === "data") {
          const reassessmentId = response.data.reassessmentId;
          const myrId = response.data.myrId;
          if (myrId) {
            router.push(
              `${Routes.ComplianceReporting}/${myrId}/reassessment/${reassessmentId}`,
            );
          } else {
            router.push(`${Routes.LegacyReassessments}/${reassessmentId}`);
          }
        }
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, [props, orgId, modelYear, assessment]);

  const handleOrgSelect = useCallback(
    (selectedOrgId: string) => {
      if (props.type === "legacyNewReassessment") {
        const orgIdNumber = Number.parseInt(selectedOrgId, 10);
        if (props.orgsMap[orgIdNumber]) {
          setOrgId(orgIdNumber);
        } else {
          setOrgId(undefined);
        }
      }
    },
    [props],
  );

  const orgsComponent: JSX.Element | null = useMemo(() => {
    let innerComponent;
    if (!assessment && props.type === "legacyNewReassessment") {
      innerComponent = (
        <select
          name="org"
          value={orgId}
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
      );
    } else if (!assessment && props.type !== "legacyNewReassessment") {
      innerComponent = (
        <input
          disabled={true}
          name="org"
          type="text"
          value={props.orgName}
          className="border p-2 w-full"
        />
      );
    }
    if (innerComponent) {
      return (
        <div className="flex items-center py-2 my-2">
          <label className="w-72" htmlFor="org">
            Supplier
          </label>
          {innerComponent}
        </div>
      );
    }
    return null;
  }, [props, orgId, assessment, handleOrgSelect]);

  const modelYearComponent: JSX.Element | null = useMemo(() => {
    let innerComponent;
    if (!assessment && props.type === "legacyNewReassessment") {
      innerComponent = (
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
          {Object.entries(legacyModelYearsMap).map(([key, value]) => (
            <option key={key} value={value}>
              {key}
            </option>
          ))}
        </select>
      );
    } else if (
      !assessment &&
      modelYear &&
      props.type !== "legacyNewReassessment"
    ) {
      innerComponent = (
        <input
          disabled={true}
          name="modelYear"
          type="text"
          value={modelYearsMap[modelYear]}
          className="border p-2 w-full"
        />
      );
    }
    if (innerComponent) {
      return (
        <div className="flex items-center py-2 my-2">
          <label className="w-72" htmlFor="modelYear">
            Model Year
          </label>
          {innerComponent}
        </div>
      );
    }
    return null;
  }, [props, modelYear, modelYearsMap, legacyModelYearsMap, assessment]);

  return (
    <div>
      {orgsComponent}
      {modelYearComponent}
      {props.type !== "assessment" && !assessment && (
        <>
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
        </>
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
              : `Clear ${props.type === "assessment" ? "Assessment" : "Reassessment"}`}
          </Button>
        ) : (
          <Button
            variant="secondary"
            onClick={handleGenerateAssessment}
            disabled={isPending}
          >
            {isPending
              ? "..."
              : `Generate ${props.type === "assessment" ? "Assessment" : "Reassessment"}`}
          </Button>
        )}
      </div>
      {assessment && <ParsedAssessment assessment={assessment[1]} />}
      {error && <p className="text-red-600">{error}</p>}
      <div className="flex space-x-2">
        <Button variant="primary" onClick={handleSave} disabled={isPending}>
          {isPending ? "..." : "Save"}
        </Button>
      </div>
    </div>
  );
};
