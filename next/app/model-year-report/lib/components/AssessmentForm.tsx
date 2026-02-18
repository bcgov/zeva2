"use client";

import axios from "axios";
import { ModelYear, VehicleClass, ZevClass } from "@/prisma/generated/enums";
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
  getWorkbook,
  getZevClassOrdering,
  validateNvValues,
} from "../utilsClient";
import { bytesToBase64 } from "@/app/lib/utils/base64";
import { Adjustment, Adjustments } from "./Adjustments";
import { Routes } from "@/app/lib/constants";
import { Workbook } from "exceljs";
import {
  getNvValues,
  getZevClassChoice,
  parseAssessment,
  ParsedAssmnt,
} from "../utils";
import { ParsedAssessment } from "./ParsedAssessment";
import { isModelYear } from "@/app/lib/utils/typeGuards";
import { legacyModelYearsMap, SupplierZevClassChoice } from "../constants";
import { ZevClassSelect } from "./ZevClassSelect";
import { getFiles } from "@/app/lib/utils/download";

type NewAssessmentProps = {
  type: "newAssessment";
  orgName: string;
  modelYear: ModelYear;
  orgId: number;
  myrId: number;
};

type SavedAssessmentProps = {
  type: "savedAssessment";
  orgName: string;
  modelYear: ModelYear;
  orgId: number;
  myrId: number;
  url: string;
};

type LegacyNewReassessmentProps = {
  type: "legacyNewReassessment";
  orgsMap: Partial<Record<number, string>>;
};

type NonLegacyNewReassessmentProps = {
  type: "nonLegacyNewReassment";
  orgName: string;
  modelYear: ModelYear;
  orgId: number;
};

// for both legacy and non-legacy saved reassessments
type SavedReassessmentProps = {
  type: "savedReassessment";
  reassessmentId: number;
  orgName: string;
  modelYear: ModelYear;
  orgId: number;
  url: string;
};

export const AssessmentForm = (
  props:
    | NewAssessmentProps
    | SavedAssessmentProps
    | LegacyNewReassessmentProps
    | NonLegacyNewReassessmentProps
    | SavedReassessmentProps,
) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [generationError, setGenerationError] = useState<string>("");
  const [saveError, setSaveError] = useState<string>("");
  const [orgsMap, setOrgsMap] = useState<Partial<Record<number, string>>>();
  const [orgId, setOrgId] = useState<number>();
  const [modelYear, setModelYear] = useState<ModelYear>();
  const [myrId, setMyrId] = useState<number>();
  const [orgName, setOrgName] = useState<string>();
  const [reassessmentId, setReassessmentId] = useState<number>();
  const [nvValues, setNvValues] = useState<NvValues>({});
  const [zevClassSelection, setZevClassSelection] =
    useState<SupplierZevClassChoice>(ZevClass.B);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [assessment, setAssessment] = useState<[Workbook, ParsedAssmnt] | null>(
    null,
  );

  useEffect(() => {
    if (props.type !== "legacyNewReassessment") {
      setOrgId(props.orgId);
      setModelYear(props.modelYear);
      setOrgName(props.orgName);
      if (props.type === "newAssessment" || props.type === "savedAssessment") {
        setMyrId(props.myrId);
      } else if (props.type === "savedReassessment") {
        setReassessmentId(props.reassessmentId);
      }
    } else {
      setOrgsMap(props.orgsMap);
    }
  }, []);

  useEffect(() => {
    if (
      props.type === "savedAssessment" ||
      props.type === "savedReassessment"
    ) {
      const loadAssessment = async () => {
        const files = await getFiles([{ fileName: "_", url: props.url }]);
        if (files.length === 1) {
          const assmnt = files[0];
          const assmntWorkbook = await getWorkbook(assmnt.data);
          const parsedAssmnt = parseAssessment(assmntWorkbook);
          setNvValues(getNvValues(parsedAssmnt.complianceReductions));
          setZevClassSelection(
            getZevClassChoice(parsedAssmnt.details.zevClassOrdering),
          );
          setAdjustments(parsedAssmnt.currentAdjustments);
          setAssessment([assmntWorkbook, parsedAssmnt]);
        }
      };
      loadAssessment();
    }
  }, []);

  const modelYearsMap = useMemo(() => {
    return getModelYearEnumsToStringsMap();
  }, []);

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
    setGenerationError("");
    startTransition(async () => {
      try {
        if (!orgId || !modelYear) {
          throw new Error("Supplier and Model Year are required!");
        }
        validateNvValues(nvValues);
        const zevClassOrdering = getZevClassOrdering(zevClassSelection);
        const adjustmentsPayload = getAdjustmentsPayload(adjustments);
        const [templateUrl, assessmentResponse] = await Promise.all([
          getAssessmentTemplateUrl(),
          getAssessmentData(
            orgId,
            modelYear,
            adjustmentsPayload,
            nvValues,
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
          modelYear,
          zevClassOrdering,
          adjustmentsPayload,
        );
        const parsedAssessment = parseAssessment(assessment);
        setAssessment([assessment, parsedAssessment]);
      } catch (e) {
        if (e instanceof Error) {
          setGenerationError(e.message);
        }
      }
    });
  }, [props.type, orgId, modelYear, nvValues, zevClassSelection, adjustments]);

  const handleClearAssessment = useCallback(() => {
    setSaveError("");
    setAssessment(null);
  }, []);

  const handleSave = useCallback(() => {
    setSaveError("");
    startTransition(async () => {
      try {
        if (!orgId || !modelYear) {
          throw new Error("Invalid supplier or model year!");
        }
        if (assessment === null) {
          throw new Error("Exactly 1 valid Assessment/Reassessment expected!");
        }
        let response;
        const assessmentBase64 = bytesToBase64(
          await assessment[0].xlsx.writeBuffer(),
        );
        if (
          myrId &&
          (props.type === "newAssessment" || props.type === "savedAssessment")
        ) {
          response = await createOrSaveAssessment(myrId, assessmentBase64);
        } else if (
          props.type === "legacyNewReassessment" ||
          props.type === "nonLegacyNewReassment"
        ) {
          response = await createReassessment(
            orgId,
            modelYear,
            assessmentBase64,
          );
        } else if (reassessmentId && props.type === "savedReassessment") {
          response = await saveReassessment(reassessmentId, assessmentBase64);
        }
        if (response && response.responseType === "error") {
          throw new Error(response.message);
        } else if (response && response.responseType === "data") {
          const responseData = response.data;
          if (typeof responseData === "number") {
            router.push(`${Routes.ComplianceReporting}/${responseData}`);
          } else {
            const { reassessmentId, myrId } = responseData;
            if (myrId) {
              router.push(
                `${Routes.ComplianceReporting}/${myrId}/reassessment/${reassessmentId}`,
              );
            } else {
              router.push(`${Routes.LegacyReassessments}/${reassessmentId}`);
            }
          }
        }
      } catch (e) {
        if (e instanceof Error) {
          setSaveError(e.message);
        }
      }
    });
  }, [props.type, orgId, modelYear, assessment, myrId, reassessmentId]);

  const handleOrgSelect = useCallback(
    (selectedOrgId: string) => {
      if (props.type === "legacyNewReassessment" && orgsMap) {
        const orgIdNumber = Number.parseInt(selectedOrgId, 10);
        if (orgsMap[orgIdNumber]) {
          setOrgId(orgIdNumber);
        } else {
          setOrgId(undefined);
        }
      }
    },
    [props.type, orgsMap],
  );

  const orgsComponent: JSX.Element | null = useMemo(() => {
    let innerComponent;
    if (orgsMap && props.type === "legacyNewReassessment") {
      innerComponent = (
        <select
          name="org"
          value={orgId}
          className="border p-2 w-full"
          onChange={(e) => {
            handleOrgSelect(e.target.value);
          }}
          disabled={!!assessment}
        >
          <option key={undefined}>--</option>
          {Object.entries(orgsMap).map(([key, value]) => (
            <option key={key} value={key}>
              {value}
            </option>
          ))}
        </select>
      );
    } else if (orgName && props.type !== "legacyNewReassessment") {
      innerComponent = (
        <input
          disabled={true}
          name="org"
          type="text"
          value={orgName}
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
  }, [props.type, orgName, orgId, orgsMap, assessment, handleOrgSelect]);

  const modelYearComponent: JSX.Element | null = useMemo(() => {
    let innerComponent;
    if (props.type === "legacyNewReassessment") {
      innerComponent = (
        <select
          name="modelYear"
          value={modelYear}
          className="border p-2 w-full"
          onChange={(e) => {
            const value = e.target.value;
            setModelYear(isModelYear(value) ? value : undefined);
          }}
          disabled={!!assessment}
        >
          <option key={undefined}>--</option>
          {Object.entries(legacyModelYearsMap).map(([key, value]) => (
            <option key={key} value={value}>
              {key}
            </option>
          ))}
        </select>
      );
    } else if (modelYear) {
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
  }, [props.type, modelYear, modelYearsMap, legacyModelYearsMap, assessment]);

  return (
    <div>
      {orgsComponent}
      {modelYearComponent}
      <MyrNvValues
        nvValues={nvValues}
        handleChange={handleNvValuesChange}
        disabled={!!assessment || isPending}
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
          disabled={!!assessment || isPending}
        />
      </div>
      <Adjustments
        type="assessment"
        adjustments={adjustments}
        setAdjustments={setAdjustments}
        disabled={!!assessment || isPending}
      />
      {generationError && <p className="text-red-600">{generationError}</p>}
      <div className="flex space-x-2">
        {assessment ? (
          <Button
            variant="secondary"
            onClick={handleClearAssessment}
            disabled={isPending}
          >
            {isPending
              ? "..."
              : `Clear ${props.type === "newAssessment" || props.type === "savedAssessment" ? "Assessment" : "Reassessment"}`}
          </Button>
        ) : (
          <Button
            variant="secondary"
            onClick={handleGenerateAssessment}
            disabled={isPending}
          >
            {isPending
              ? "..."
              : `Generate ${props.type === "newAssessment" || props.type === "savedAssessment" ? "Assessment" : "Reassessment"}`}
          </Button>
        )}
      </div>
      {assessment && <ParsedAssessment assessment={assessment[1]} />}
      {saveError && <p className="text-red-600">{saveError}</p>}
      <div className="flex space-x-2">
        <Button variant="primary" onClick={handleSave} disabled={isPending}>
          {isPending ? "..." : "Save"}
        </Button>
      </div>
    </div>
  );
};
