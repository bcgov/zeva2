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
  createOrSaveSupplementaryReassessment,
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
import { getNvValues, getZevClassChoice, parseAssessment } from "../utils";
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
  type: "nonLegacyNewReassessment";
  orgName: string;
  modelYear: ModelYear;
  orgId: number;
  myrId: number;
};

type LegacySavedReassessmentProps = {
  type: "legacySavedReassessment";
  reassessmentId: number;
  orgName: string;
  modelYear: ModelYear;
  orgId: number;
  url: string;
};

type NonLegacySavedReassessmentProps = {
  type: "nonLegacySavedReassessment";
  reassessmentId: number;
  orgName: string;
  modelYear: ModelYear;
  orgId: number;
  myrId: number;
  url: string;
};

type LegacyNewSuppReassessmentProps = {
  type: "legacyNewSuppReassessment";
  suppId: number;
  orgName: string;
  modelYear: ModelYear;
  orgId: number;
};

type NonLegacyNewSuppReassessmentProps = {
  type: "nonLegacyNewSuppReassessment";
  suppId: number;
  orgName: string;
  modelYear: ModelYear;
  orgId: number;
  myrId: number;
};

type LegacySavedSuppReassessmentProps = {
  type: "legacySavedSuppReassessment";
  suppId: number;
  orgName: string;
  modelYear: ModelYear;
  orgId: number;
  url: string;
};

type NonLegacySavedSuppReassessmentProps = {
  type: "nonLegacySavedSuppReassessment";
  suppId: number;
  orgName: string;
  modelYear: ModelYear;
  orgId: number;
  myrId: number;
  url: string;
};

export const AssessmentForm = (
  props:
    | NewAssessmentProps
    | SavedAssessmentProps
    | LegacyNewReassessmentProps
    | NonLegacyNewReassessmentProps
    | LegacySavedReassessmentProps
    | NonLegacySavedReassessmentProps
    | LegacyNewSuppReassessmentProps
    | NonLegacyNewSuppReassessmentProps
    | LegacySavedSuppReassessmentProps
    | NonLegacySavedSuppReassessmentProps,
) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");
  const [orgsMap, setOrgsMap] = useState<Partial<Record<number, string>>>();
  const [orgId, setOrgId] = useState<number>();
  const [modelYear, setModelYear] = useState<ModelYear>();
  const [myrId, setMyrId] = useState<number>();
  const [orgName, setOrgName] = useState<string>();
  const [reassessmentId, setReassessmentId] = useState<number>();
  const [suppId, setSuppId] = useState<number>();
  const [nvValues, setNvValues] = useState<NvValues>({});
  const [zevClassSelection, setZevClassSelection] =
    useState<SupplierZevClassChoice>(ZevClass.B);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);

  useEffect(() => {
    switch (props.type) {
      case "newAssessment":
        setOrgName(props.orgName);
        setModelYear(props.modelYear);
        setOrgId(props.orgId);
        setMyrId(props.myrId);
        break;
      case "savedAssessment":
        setOrgName(props.orgName);
        setModelYear(props.modelYear);
        setOrgId(props.orgId);
        setMyrId(props.myrId);
        break;
      case "legacyNewReassessment":
        setOrgsMap(props.orgsMap);
        break;
      case "nonLegacyNewReassessment":
        setOrgName(props.orgName);
        setModelYear(props.modelYear);
        setOrgId(props.orgId);
        setMyrId(props.myrId);
        break;
      case "legacySavedReassessment":
        setReassessmentId(props.reassessmentId);
        setOrgName(props.orgName);
        setModelYear(props.modelYear);
        setOrgId(props.orgId);
        break;
      case "nonLegacySavedReassessment":
        setReassessmentId(props.reassessmentId);
        setOrgName(props.orgName);
        setModelYear(props.modelYear);
        setOrgId(props.orgId);
        setMyrId(props.myrId);
        break;
      case "legacyNewSuppReassessment":
        setSuppId(props.suppId);
        setOrgName(props.orgName);
        setModelYear(props.modelYear);
        setOrgId(props.orgId);
        break;
      case "nonLegacyNewSuppReassessment":
        setSuppId(props.suppId);
        setOrgName(props.orgName);
        setModelYear(props.modelYear);
        setOrgId(props.orgId);
        setMyrId(props.myrId);
        break;
      case "legacySavedSuppReassessment":
        setSuppId(props.suppId);
        setOrgName(props.orgName);
        setModelYear(props.modelYear);
        setOrgId(props.orgId);
        break;
      case "nonLegacySavedSuppReassessment":
        setSuppId(props.suppId);
        setOrgName(props.orgName);
        setModelYear(props.modelYear);
        setOrgId(props.orgId);
        setMyrId(props.myrId);
        break;
    }
  }, []);

  useEffect(() => {
    if (
      props.type === "savedAssessment" ||
      props.type === "legacySavedReassessment" ||
      props.type === "nonLegacySavedReassessment" ||
      props.type === "legacySavedSuppReassessment" ||
      props.type === "nonLegacySavedSuppReassessment"
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

  const generateAssmnt = useCallback(async () => {
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
    return assessment;
  }, [props.type, orgId, modelYear, nvValues, zevClassSelection, adjustments]);

  const saveAssmnt = useCallback(
    async (assessment: Workbook) => {
      if (!orgId || !modelYear) {
        throw new Error("Invalid supplier or model year!");
      }
      let response;
      const assessmentBase64 = bytesToBase64(
        await assessment.xlsx.writeBuffer(),
      );
      switch (props.type) {
        case "newAssessment":
          if (myrId) {
            response = await createOrSaveAssessment(myrId, assessmentBase64);
          }
          break;
        case "savedAssessment":
          if (myrId) {
            response = await createOrSaveAssessment(myrId, assessmentBase64);
          }
          break;
        case "legacyNewReassessment":
          response = await createReassessment(
            orgId,
            modelYear,
            assessmentBase64,
          );
          break;
        case "nonLegacyNewReassessment":
          if (myrId) {
            response = await createReassessment(
              orgId,
              modelYear,
              assessmentBase64,
              myrId,
            );
          }
          break;
        case "legacySavedReassessment":
          if (reassessmentId) {
            response = await saveReassessment(reassessmentId, assessmentBase64);
          }
          break;
        case "nonLegacySavedReassessment":
          if (reassessmentId) {
            response = await saveReassessment(reassessmentId, assessmentBase64);
          }
          break;
        case "legacyNewSuppReassessment":
          if (suppId) {
            response = await createOrSaveSupplementaryReassessment(
              suppId,
              assessmentBase64,
            );
          }
          break;
        case "nonLegacyNewSuppReassessment":
          if (suppId) {
            response = await createOrSaveSupplementaryReassessment(
              suppId,
              assessmentBase64,
            );
          }
          break;
        case "legacySavedSuppReassessment":
          if (suppId) {
            response = await createOrSaveSupplementaryReassessment(
              suppId,
              assessmentBase64,
            );
          }
          break;
        case "nonLegacySavedSuppReassessment":
          if (suppId) {
            response = await createOrSaveSupplementaryReassessment(
              suppId,
              assessmentBase64,
            );
          }
          break;
      }
      if (response && response.responseType === "error") {
        throw new Error(response.message);
      } else if (response && response.responseType === "data") {
        const responseData = response.data;
        switch (props.type) {
          case "newAssessment":
            if (myrId) {
              router.push(`${Routes.ComplianceReporting}/${myrId}`);
            }
            break;
          case "savedAssessment":
            if (myrId) {
              router.push(`${Routes.ComplianceReporting}/${myrId}`);
            }
            break;
          case "legacyNewReassessment":
            router.push(`${Routes.LegacyReassessments}/${responseData}`);
            break;
          case "nonLegacyNewReassessment":
            if (myrId) {
              router.push(
                `${Routes.ComplianceReporting}/${myrId}/reassessment/${responseData}`,
              );
            }
            break;
          case "legacySavedReassessment":
            router.push(`${Routes.LegacyReassessments}/${responseData}`);
            break;
          case "nonLegacySavedReassessment":
            if (myrId) {
              router.push(
                `${Routes.ComplianceReporting}/${myrId}/reassessment/${responseData}`,
              );
            }
            break;
          case "legacyNewSuppReassessment":
            if (suppId) {
              router.push(`${Routes.LegacySupplementary}/${suppId}`);
            }
            break;
          case "nonLegacyNewSuppReassessment":
            if (myrId && suppId) {
              router.push(
                `${Routes.ComplianceReporting}/${myrId}/supplementary/${suppId}`,
              );
            }
            break;
          case "legacySavedSuppReassessment":
            if (suppId) {
              router.push(`${Routes.LegacySupplementary}/${suppId}`);
            }
            break;
          case "nonLegacySavedSuppReassessment":
            if (myrId && suppId) {
              router.push(
                `${Routes.ComplianceReporting}/${myrId}/supplementary/${suppId}`,
              );
            }
            break;
        }
      }
    },
    [props.type, orgId, modelYear, myrId, reassessmentId, suppId],
  );

  const handleGenerateAndSaveAssmnt = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        const assmnt = await generateAssmnt();
        await saveAssmnt(assmnt);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, [generateAssmnt, saveAssmnt]);

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
          disabled={isPending}
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
  }, [props.type, orgName, orgId, orgsMap, isPending, handleOrgSelect]);

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
          disabled={isPending}
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
  }, [props.type, modelYear, modelYearsMap, legacyModelYearsMap, isPending]);

  return (
    <div>
      {orgsComponent}
      {modelYearComponent}
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
        type="assessment"
        adjustments={adjustments}
        setAdjustments={setAdjustments}
        disabled={isPending}
      />
      {error && <p className="text-red-600">{error}</p>}
      <div className="flex space-x-2">
        <Button
          variant="primary"
          onClick={handleGenerateAndSaveAssmnt}
          disabled={isPending}
        >
          {isPending ? "..." : "Generate and Save Assessment"}
        </Button>
      </div>
    </div>
  );
};
