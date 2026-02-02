"use client";

import axios from "axios";
import { Button } from "@/app/lib/components";
import { getModelYearEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { ModelYear, VehicleClass, ZevClass } from "@/prisma/generated/client";
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
  createSupplementary,
  getMyrData,
  getMyrTemplateUrl,
  NvValues,
  saveSupplementary,
} from "../actions";
import {
  generateMyr,
  getWorkbook,
  getZevClassOrdering,
  validateNvValues,
} from "../utilsClient";
import { bytesToBase64 } from "@/app/lib/utils/base64";
import { legacyModelYearsMap, SupplierZevClassChoice } from "../constants";
import { MyrNvValues } from "./MyrNvValues";
import { ZevClassSelect } from "./ZevClassSelect";
import { Routes } from "@/app/lib/constants";
import { CommentBox } from "@/app/lib/components/inputs/CommentBox";
import { Workbook } from "exceljs";
import { ParsedMyr, parseMyr } from "../utils";
import { ParsedModelYearReport } from "./ParsedModelYearReport";
import { isModelYear } from "@/app/lib/utils/typeGuards";
import { getFiles } from "@/app/lib/utils/download";

type LegacyNewSuppProps = {
  type: "legacyNew";
};

type NonLegacyNewSuppProps = {
  type: "nonLegacyNew";
  modelYear: ModelYear;
};

type SavedSuppProps = {
  type: "saved";
  modelYear: ModelYear;
  supplementaryId: number;
  url: string;
};

export const SupplementaryForm = (
  props: LegacyNewSuppProps | NonLegacyNewSuppProps | SavedSuppProps,
) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modelYear, setModelYear] = useState<ModelYear | undefined>();
  const [error, setError] = useState<string>("");
  const [nvValues, setNvValues] = useState<NvValues>({});
  const [zevClassSelection, setZevClassSelection] =
    useState<SupplierZevClassChoice>(ZevClass.B);
  const [report, setReport] = useState<[Workbook, ParsedMyr] | null>(null);
  const [comment, setComment] = useState<string>("");

  useEffect(() => {
    if (props.type === "saved") {
      const loadSupp = async () => {
        const files = await getFiles([{ fileName: "_", url: props.url }]);
        if (files.length === 1) {
          const supp = files[0];
          const suppWorkbook = await getWorkbook(supp.data);
          const parsedSupp = parseMyr(suppWorkbook);
          setReport([suppWorkbook, parsedSupp]);
        }
      };
      loadSupp();
    }
  }, [props]);

  useEffect(() => {
    if (props.type === "nonLegacyNew" || props.type === "saved") {
      setModelYear(props.modelYear);
    }
  }, [props]);

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

  const handleGenerateReport = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        if (!modelYear) {
          throw new Error("Please select a Model Year!");
        }
        validateNvValues(nvValues);
        const zevClassOrdering = getZevClassOrdering(zevClassSelection);
        const [templateUrl, myrDataResponse] = await Promise.all([
          getMyrTemplateUrl(),
          getMyrData(modelYear, nvValues, zevClassOrdering),
        ]);
        if (myrDataResponse.responseType === "error") {
          throw new Error(myrDataResponse.message);
        }
        const templateResponse = await axios.get(templateUrl, {
          responseType: "arraybuffer",
        });
        const template = templateResponse.data;
        const workbook = await generateMyr(template, myrDataResponse.data);
        const parsedMyr = parseMyr(workbook);
        setReport([workbook, parsedMyr]);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, [modelYear, nvValues, zevClassSelection]);

  const handleClearReport = useCallback(() => {
    setError("");
    setReport(null);
  }, []);

  const handleSave = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        if (!modelYear) {
          throw new Error("You must select a Model Year!");
        }
        if (!report) {
          throw new Error("You must generate a Supplementary Report!");
        }
        const reportAsBase64 = bytesToBase64(
          await report[0].xlsx.writeBuffer(),
        );
        let response;
        if (props.type === "legacyNew" || props.type === "nonLegacyNew") {
          response = await createSupplementary(modelYear, reportAsBase64);
        } else {
          response = await saveSupplementary(
            props.supplementaryId,
            reportAsBase64,
          );
        }
        if (response.responseType === "error") {
          throw new Error(response.message);
        } else {
          const { myrId, supplementaryId } = response.data;
          if (myrId) {
            router.push(
              `${Routes.ComplianceReporting}/${myrId}/supplementary/${supplementaryId}`,
            );
          } else {
            router.push(`${Routes.LegacySupplementary}/${supplementaryId}`);
          }
        }
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, [props, report]);

  const modelYearComponent: JSX.Element | null = useMemo(() => {
    let innerComponent;
    if (
      !report &&
      modelYear &&
      (props.type === "nonLegacyNew" || props.type === "saved")
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
    } else if (!report && props.type === "legacyNew") {
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
  }, [props, report, modelYear]);

  return (
    <div>
      {modelYearComponent}
      {!report && (
        <MyrNvValues
          nvValues={nvValues}
          handleChange={handleNvValuesChange}
          disabled={isPending}
        />
      )}
      {!report && (
        <>
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
      <div className="flex space-x-2">
        {report ? (
          <Button
            variant="tertiary"
            size="small"
            onClick={handleClearReport}
            disabled={isPending}
          >
            {isPending ? "..." : "Clear Generated Report"}
          </Button>
        ) : (
          <Button
            variant="secondary"
            onClick={handleGenerateReport}
            disabled={isPending}
          >
            {isPending ? "..." : "Generate your Supplementary Report"}
          </Button>
        )}
      </div>
      {report && <ParsedModelYearReport myr={report[1]} />}
      <CommentBox
        comment={comment}
        setComment={setComment}
        disabled={isPending}
      />
      {error && <p className="text-red-600">{error}</p>}
      <div className="flex space-x-2">
        <Button variant="primary" onClick={handleSave} disabled={isPending}>
          {isPending ? "..." : "Save"}
        </Button>
      </div>
    </div>
  );
};
