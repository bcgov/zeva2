"use client";

import axios from "axios";
import { Button } from "@/app/lib/components";
import { getModelYearEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { ModelYear, VehicleClass, ZevClass } from "@/prisma/generated/client";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import {
  getForecastTemplateUrl,
  getMyrData,
  getMyrTemplateUrl,
  NvValues,
  submitReports,
} from "../actions";
import {
  generateMyr,
  getWorkbook,
  getZevClassOrdering,
  validateForecastReport,
  validateNvValues,
} from "../utilsClient";
import { bytesToBase64 } from "@/app/lib/utils/base64";
import { downloadBuffer } from "@/app/lib/utils/download";
import { Dropzone } from "@/app/lib/components/Dropzone";
import { SupplierZevClassChoice } from "../constants";
import { MyrNvValues } from "./MyrNvValues";
import { ZevClassSelect } from "./ZevClassSelect";
import { Routes } from "@/app/lib/constants";
import { CommentBox } from "@/app/lib/components/inputs/CommentBox";
import { getNormalizedComment } from "@/app/credit-application/lib/utils";
import { Workbook } from "exceljs";
import { ParsedForecast, ParsedMyr, parseForecast, parseMyr } from "../utils";
import { ParsedModelYearReport } from "./ParsedModelYearReport";
import { ParsedForecastTables } from "./ParsedForecastReport";

export const ModelYearReportForm = (props: {
  orgName: string;
  modelYear: ModelYear;
  modelYearReportId?: number;
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");
  const [nvValues, setNvValues] = useState<NvValues>({});
  const [zevClassSelection, setZevClassSelection] =
    useState<SupplierZevClassChoice>(ZevClass.B);
  const [myr, setMyr] = useState<[Workbook, ParsedMyr] | null>(null);
  const [forecasts, setForecasts] = useState<File[]>([]);
  const [parsedForecast, setParsedForecast] = useState<ParsedForecast | null>(
    null,
  );
  const [comment, setComment] = useState<string>("");

  useEffect(() => {
    const onForecastChange = async () => {
      if (forecasts.length === 0) {
        setParsedForecast(null);
      } else {
        const buf = await forecasts[0].arrayBuffer();
        const workbook = await getWorkbook(buf);
        try {
          validateForecastReport(workbook);
        } catch (e) {
          if (e instanceof Error) {
            setError(e.message);
          }
          throw e;
        }
        setParsedForecast(parseForecast(workbook));
      }
    };
    onForecastChange();
  }, [forecasts]);

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
        validateNvValues(nvValues);
        const zevClassOrdering = getZevClassOrdering(zevClassSelection);
        const [templateUrl, myrDataResponse] = await Promise.all([
          getMyrTemplateUrl(),
          getMyrData(props.modelYear, nvValues, zevClassOrdering),
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
        setMyr([workbook, parsedMyr]);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, [props.modelYear, nvValues, zevClassSelection, props.orgName]);

  const handleClearMyr = useCallback(() => {
    setError("");
    setMyr(null);
  }, []);

  const handleDownloadForecastTemplate = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        const templateUrl = await getForecastTemplateUrl();
        const templateResponse = await axios.get(templateUrl, {
          responseType: "arraybuffer",
        });
        const fileName = `forecast-report-${props.orgName.replaceAll(" ", "-")}-${modelYearsMap[props.modelYear]}.xlsx`;
        downloadBuffer(fileName, templateResponse.data);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, [props.orgName, props.modelYear]);

  const handleSubmit = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        if (!myr) {
          throw new Error("You must generate a Model Year Report!");
        }
        if (forecasts.length !== 1 || !parsedForecast) {
          throw new Error("Exactly 1 Forecast Report expected!");
        }
        const response = await submitReports(
          props.modelYear,
          bytesToBase64(await myr[0].xlsx.writeBuffer()),
          bytesToBase64(await forecasts[0].arrayBuffer()),
          getNormalizedComment(comment),
        );
        if (response.responseType === "error") {
          throw new Error(response.message);
        } else if (response.responseType === "data") {
          router.push(`${Routes.ComplianceReporting}/${response.data}`);
        } else {
          router.push(
            `${Routes.ComplianceReporting}/${props.modelYearReportId}`,
          );
        }
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, [props.modelYear, props.modelYearReportId, myr, forecasts, comment]);

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
      {!myr && (
        <MyrNvValues
          nvValues={nvValues}
          handleChange={handleNvValuesChange}
          disabled={isPending}
        />
      )}
      {!myr && (
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
        {myr ? (
          <Button onClick={handleClearMyr} disabled={isPending}>
            {isPending ? "..." : "Clear Generated Report"}
          </Button>
        ) : (
          <Button onClick={handleGenerateReport} disabled={isPending}>
            {isPending ? "..." : "Generate your Model Year Report"}
          </Button>
        )}
      </div>
      {myr && <ParsedModelYearReport myr={myr[1]} />}
      <div className="flex space-x-2">
        <Button onClick={handleDownloadForecastTemplate} disabled={isPending}>
          {isPending ? "..." : "Download Forecast Report Template"}
        </Button>
      </div>
      <div className="flex items-center space-x-4">
        <span>Upload your Forecast Report here:</span>
        <Dropzone
          files={forecasts}
          setFiles={setForecasts}
          disabled={isPending}
          maxNumberOfFiles={1}
          allowedFileTypes={{
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
              [".xlsx"],
          }}
        />
      </div>
      {forecasts.length === 1 && parsedForecast && (
        <ParsedForecastTables forecast={parsedForecast} />
      )}
      <CommentBox
        comment={comment}
        setComment={setComment}
        disabled={isPending}
      />
      {error && <p className="text-red-600">{error}</p>}
      <div className="flex space-x-2">
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending ? "..." : "Submit"}
        </Button>
      </div>
    </div>
  );
};
