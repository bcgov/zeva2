"use client";

import axios from "axios";
import { Button } from "@/app/lib/components";
import { getModelYearEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { ModelYear, VehicleClass, ZevClass } from "@/prisma/generated/client";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import {
  getForecastTemplateUrl,
  getMyrData,
  getMyrTemplateUrl,
  getPutReportData,
  NvValues,
  resubmitReports,
  submitReports,
} from "../actions";
import {
  getZevClassOrdering,
  validateNvValues,
  downloadMyr,
} from "../utilsClient";
import { downloadBuffer } from "@/app/lib/utils/download";
import { Dropzone } from "@/app/lib/components/Dropzone";
import { FileWithPath } from "react-dropzone";
import { SupplierZevClassChoice } from "../constants";
import { MyrNvValues } from "./MyrNvValues";
import { ZevClassSelect } from "./ZevClassSelect";
import { Routes } from "@/app/lib/constants";
import { CommentBox } from "@/app/lib/components/inputs/CommentBox";
import { getNormalizedComment } from "@/app/credit-application/lib/utils";

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
  const [myrs, setMyrs] = useState<FileWithPath[]>([]);
  const [forecasts, setForecasts] = useState<FileWithPath[]>([]);
  const [comment, setComment] = useState<string>("");

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
        await downloadMyr(
          template,
          myrDataResponse.data,
          zevClassSelection,
          props.orgName,
          props.modelYear,
        );
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, [props.modelYear, nvValues, zevClassSelection, props.orgName]);

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
        if (myrs.length !== 1 || forecasts.length !== 1) {
          throw new Error(
            "Exactly 1 Model Year Report and exactly 1 Forecast Report expected!",
          );
        }
        const myr = myrs[0];
        const forecast = forecasts[0];
        const putData = await getPutReportData();
        await Promise.all([
          axios.put(putData.myr.url, myr),
          axios.put(putData.forecast.url, forecast),
        ]);
        const payload: [string, string, string, string, string | undefined] = [
          putData.myr.objectName,
          myr.name,
          putData.forecast.objectName,
          forecast.name,
          getNormalizedComment(comment),
        ];
        let response;
        if (props.modelYearReportId) {
          response = await resubmitReports(props.modelYearReportId, ...payload);
        } else {
          response = await submitReports(props.modelYear, ...payload);
        }
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
  }, [props.modelYear, props.modelYearReportId, myrs, forecasts, comment]);

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
      <div className="flex space-x-2">
        <Button onClick={handleGenerateReport} disabled={isPending}>
          {isPending ? "..." : "Generate and Download Model Year Report"}
        </Button>
      </div>
      <div className="flex space-x-2">
        <Button onClick={handleDownloadForecastTemplate} disabled={isPending}>
          {isPending ? "..." : "Download Forecast Report Template"}
        </Button>
      </div>
      <div className="flex items-center space-x-4">
        <span>Upload your Model Year Report here:</span>
        <Dropzone
          files={myrs}
          setFiles={setMyrs}
          disabled={isPending}
          maxNumberOfFiles={1}
          allowedFileTypes={{
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
              [".xlsx"],
          }}
        />
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
      <CommentBox
        comment={comment}
        setComment={setComment}
        disabled={isPending}
      />
      <div className="flex space-x-2">
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending ? "..." : "Submit"}
        </Button>
      </div>
    </div>
  );
};
