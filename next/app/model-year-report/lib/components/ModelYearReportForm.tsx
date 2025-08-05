"use client";

import axios from "axios";
import { Button } from "@/app/lib/components";
import {
  getModelYearEnumsToStringsMap,
  getVehicleClassEnumsToStringsMap,
} from "@/app/lib/utils/enumMaps";
import { ModelYear, VehicleClass, ZevClass } from "@/prisma/generated/client";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import {
  getForecastTemplateUrl,
  getMyrData,
  getMyrTemplateUrl,
  NvValues,
} from "../actions";
import {
  getZevClassOrdering,
  validateNvValues,
  downloadMyr,
} from "../utilsClient";
import { downloadBuffer } from "@/app/lib/utils/download";
import { Dropzone } from "@/app/lib/components/Dropzone";
import { FileWithPath } from "react-dropzone";
import { SupplierZevClassChoice } from "../utilsClient";

export const ModelYearReportForm = (props: {
  orgName: string;
  modelYear: ModelYear;
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");
  const [nvValues, setNvValues] = useState<NvValues>({});
  const [zevClassSelection, setZevClassSelection] =
    useState<SupplierZevClassChoice>(ZevClass.B);
  const [reports, setReports] = useState<FileWithPath[]>([]);
  const [forecasts, setForecasts] = useState<FileWithPath[]>([]);

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

  const handleZevClassSelect = useCallback((zevClass: string) => {
    if (zevClass === ZevClass.A) {
      setZevClassSelection(ZevClass.A);
    } else {
      setZevClassSelection(ZevClass.B);
    }
  }, []);

  const nvValuesJSX = useMemo(() => {
    const vehicleClassMap = getVehicleClassEnumsToStringsMap();
    return Object.values(VehicleClass).map((vehicleClass) => (
      <div key={vehicleClass} className="flex items-center py-2 my-2">
        <label className="w-72" htmlFor={`${vehicleClass}-vehicle-class`}>
          {`Section 11 NV value for the ${vehicleClassMap[vehicleClass]} vehicle class`}
        </label>
        <input
          name={`${vehicleClass}-vehicle-class`}
          type="text"
          value={nvValues[vehicleClass] ?? ""}
          onChange={(e) => handleNvValuesChange(vehicleClass, e.target.value)}
          className="border p-2 w-full"
          disabled={isPending}
        />
      </div>
    ));
  }, [nvValues, handleNvValuesChange, isPending]);

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
        if (reports.length !== 1 || forecasts.length !== 1) {
          throw new Error(
            "Exactly 1 Model Year Report and exactly 1 Forecast Report expected!",
          );
        }
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, []);

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
      {nvValuesJSX}
      <div className="flex items-center py-2 my-2">
        <p>
          Select the ZEV class of credits that should be used first when
          offsetting debits of the unspecified ZEV class:
        </p>
        <input
          id="A"
          name="priorityZevClass"
          type="radio"
          value={ZevClass.A}
          checked={zevClassSelection === ZevClass.A}
          onChange={(e) => {
            handleZevClassSelect(e.target.value);
          }}
          disabled={isPending}
        />
        <label htmlFor="A">A</label>
        <input
          id="B"
          name="priorityZevClass"
          type="radio"
          value={ZevClass.B}
          checked={zevClassSelection === ZevClass.B}
          onChange={(e) => {
            handleZevClassSelect(e.target.value);
          }}
          disabled={isPending}
        />
        <label htmlFor="B">B</label>
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
          files={reports}
          setFiles={setReports}
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
      <div className="flex space-x-2">
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending ? "..." : "Submit"}
        </Button>
      </div>
    </div>
  );
};
