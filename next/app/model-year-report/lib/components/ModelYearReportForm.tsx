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
  getForecastTemplateUrl,
  getMyrData,
  getMyrTemplateUrl,
  NvValues,
  retrieveVehicleStatistics,
  saveReports,
  saveSupplementary,
} from "../actions";
import {
  generateMyr,
  getAdjustmentsPayload,
  getWorkbook,
  getZevClassOrdering,
  populateForecastTemplate,
  validateForecastReport,
  validateNvValues,
} from "../utilsClient";
import { bytesToBase64 } from "@/app/lib/utils/base64";
import { downloadBuffer, getFiles } from "@/app/lib/utils/download";
import { Dropzone } from "@/app/lib/components/Dropzone";
import { legacyModelYearsMap, SupplierZevClassChoice } from "../constants";
import { MyrNvValues } from "./MyrNvValues";
import { ZevClassSelect } from "./ZevClassSelect";
import { Routes } from "@/app/lib/constants";
import { Workbook } from "exceljs";
import {
  getNvValues,
  getVehicleStatsAsStrings,
  getZevClassChoice,
  ParsedMyr,
  parseMyr,
  VehicleStatString,
} from "../utils";
import { ParsedModelYearReport } from "./ParsedModelYearReport";
import { AttachmentDownload } from "@/app/lib/services/attachments";
import { VehicleStatistic } from "../services";
import { Adjustment, Adjustments } from "./Adjustments";
import { isModelYear } from "@/app/lib/utils/typeGuards";
import { VehicleStatsInput } from "./VehicleStatsInputs";
import { SupplierData } from "../data";

type NewMyrOrNonLegacyNewSuppProps = {
  type: "newMyr" | "nonLegacyNewSupp";
  modelYear: ModelYear;
  supplierData: SupplierData;
  vehicleStatistics: VehicleStatistic[];
};

type LegacyNewSuppProps = {
  type: "legacyNewSupp";
  supplierData: SupplierData;
};

type SavedMyrProps = {
  type: "savedMyr";
  modelYear: ModelYear;
  myrUrl: string;
  forecast: AttachmentDownload;
  supplierData: SupplierData;
  vehicleStatistics: VehicleStatistic[];
};

type LegacySavedSuppOrNonLegacySavedSuppProps = {
  type: "legacySavedSupp" | "nonLegacySavedSupp";
  modelYear: ModelYear;
  supplementaryId: number;
  url: string;
  supplierData: SupplierData;
  vehicleStatistics: VehicleStatistic[];
};

export const ModelYearReportForm = (
  props:
    | NewMyrOrNonLegacyNewSuppProps
    | SavedMyrProps
    | LegacyNewSuppProps
    | LegacySavedSuppOrNonLegacySavedSuppProps,
) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modelYear, setModelYear] = useState<ModelYear>();
  const [supplementaryId, setSupplementaryId] = useState<number>();
  const [legalName, setLegalName] = useState<string>();
  const [serviceAddress, setServiceAddress] = useState<string>();
  const [recordsAddress, setRecordsAddress] = useState<string>();
  const [makes, setMakes] = useState<string>();
  const [vehicleStats, setVehicleStats] = useState<VehicleStatString[]>([]);
  const [nvValues, setNvValues] = useState<NvValues>({});
  const [zevClassSelection, setZevClassSelection] =
    useState<SupplierZevClassChoice>(ZevClass.B);
  const [suggestedAdjustments, setSuggestedAdjustments] = useState<
    Adjustment[]
  >([]);
  const [report, setReport] = useState<[Workbook, ParsedMyr] | null>(null);
  const [forecasts, setForecasts] = useState<File[]>([]);
  const [generationError, setGenerationError] = useState<string>("");
  const [saveError, setSaveError] = useState<string>("");

  useEffect(() => {
    if (props.type !== "legacyNewSupp") {
      setModelYear(props.modelYear);
    }
    if (
      props.type === "newMyr" ||
      props.type === "legacyNewSupp" ||
      props.type === "nonLegacyNewSupp"
    ) {
      setLegalName(props.supplierData.legalName);
      setMakes(props.supplierData.makes);
      setRecordsAddress(props.supplierData.recordsAddress);
      setServiceAddress(props.supplierData.serviceAddress);
      if (props.type === "newMyr" || props.type === "nonLegacyNewSupp") {
        const vehicleStats = getVehicleStatsAsStrings(props.vehicleStatistics);
        setVehicleStats(vehicleStats);
      }
    }
    if (
      props.type === "legacySavedSupp" ||
      props.type === "nonLegacySavedSupp"
    ) {
      setSupplementaryId(props.supplementaryId);
    }
  }, []);

  useEffect(() => {
    if (props.type === "legacyNewSupp" && modelYear) {
      startTransition(async () => {
        const response = await retrieveVehicleStatistics(modelYear);
        const vehicleStats = getVehicleStatsAsStrings(response.data);
        setVehicleStats(vehicleStats);
      });
    }
  }, [props.type, modelYear]);

  useEffect(() => {
    if (
      props.type === "savedMyr" ||
      props.type === "legacySavedSupp" ||
      props.type === "nonLegacySavedSupp"
    ) {
      const loadReports = async () => {
        let report: [Workbook, ParsedMyr] | null = null;
        if (props.type === "savedMyr") {
          const files = await getFiles([
            { fileName: "_", url: props.myrUrl },
            props.forecast,
          ]);
          if (files.length === 2) {
            const myr = files[0];
            const forecast = files[1];
            const myrWorkbook = await getWorkbook(myr.data);
            const parsedMyr = parseMyr(myrWorkbook);
            const forecastFile = new File([forecast.data], forecast.fileName);
            report = [myrWorkbook, parsedMyr];
            setForecasts([forecastFile]);
          }
        } else {
          const files = await getFiles([{ fileName: "_", url: props.url }]);
          if (files.length === 1) {
            const supp = files[0];
            const suppWorkbook = await getWorkbook(supp.data);
            const parsedSupp = parseMyr(suppWorkbook);
            report = [suppWorkbook, parsedSupp];
          }
        }
        if (report) {
          const parsedReport = report[1];
          const savedDetails = parsedReport.supplierDetails;
          const savedVehicleStats = parsedReport.vehicleStatistics;
          setLegalName(savedDetails.legalName);
          setMakes(savedDetails.makes);
          setRecordsAddress(savedDetails.recordsAddress);
          setServiceAddress(savedDetails.serviceAddress);
          setVehicleStats(savedVehicleStats);
          setSuggestedAdjustments(parsedReport.suggestedAdjustments);
          setNvValues(getNvValues(parsedReport.complianceReductions));
          setZevClassSelection(
            getZevClassChoice(savedDetails.zevClassOrdering),
          );
          setReport(report);
        }
      };
      loadReports();
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

  const handleGenerateReport = useCallback(() => {
    setGenerationError("");
    startTransition(async () => {
      try {
        if (
          !modelYear ||
          !legalName ||
          !serviceAddress ||
          !recordsAddress ||
          !makes
        ) {
          throw new Error("Please ensure no field is empty!");
        }
        validateNvValues(nvValues);
        const zevClassOrdering = getZevClassOrdering(zevClassSelection);
        const adjustmentsPayload = getAdjustmentsPayload(suggestedAdjustments);
        const [templateUrl, myrDataResponse] = await Promise.all([
          getMyrTemplateUrl(),
          getMyrData(modelYear, nvValues, zevClassOrdering, adjustmentsPayload),
        ]);
        if (myrDataResponse.responseType === "error") {
          throw new Error(myrDataResponse.message);
        }
        const templateResponse = await axios.get(templateUrl, {
          responseType: "arraybuffer",
        });
        const template = templateResponse.data;
        const workbook = await generateMyr(
          template,
          myrDataResponse.data,
          zevClassOrdering,
          legalName,
          makes,
          recordsAddress,
          serviceAddress,
          vehicleStats,
          adjustmentsPayload,
        );
        const parsedMyr = parseMyr(workbook);
        setReport([workbook, parsedMyr]);
      } catch (e) {
        if (e instanceof Error) {
          setGenerationError(e.message);
        }
      }
    });
  }, [
    modelYear,
    legalName,
    makes,
    recordsAddress,
    serviceAddress,
    vehicleStats,
    nvValues,
    zevClassSelection,
    suggestedAdjustments,
  ]);

  const handleClearMyr = useCallback(() => {
    setSaveError("");
    setReport(null);
  }, []);

  const handleDownloadForecastTemplate = useCallback(() => {
    if (modelYear && (props.type === "newMyr" || props.type === "savedMyr")) {
      startTransition(async () => {
        const templateUrl = await getForecastTemplateUrl();
        const templateResponse = await axios.get(templateUrl, {
          responseType: "arraybuffer",
        });
        const template = await populateForecastTemplate(
          templateResponse.data,
          modelYear,
        );
        const templateBuf = await template.xlsx.writeBuffer();
        const fileName = `forecast-report-${modelYearsMap[modelYear]}.xlsx`;
        downloadBuffer(fileName, templateBuf);
      });
    }
  }, [props.type, modelYear]);

  const handleSave = useCallback(() => {
    setSaveError("");
    startTransition(async () => {
      try {
        if (!modelYear) {
          throw new Error("You must select a Model Year!");
        }
        if (!report) {
          throw new Error("You must generate a report!");
        }
        if (props.type === "newMyr" || props.type === "savedMyr") {
          if (forecasts.length !== 1) {
            throw new Error("Exactly 1 Forecast Report expected!");
          }
          const forecastBuf = await forecasts[0].arrayBuffer();
          const forecastWorkbook = await getWorkbook(forecastBuf);
          validateForecastReport(forecastWorkbook, modelYear);
        }
        const reportAsBase64 = bytesToBase64(
          await report[0].xlsx.writeBuffer(),
        );
        let response;
        if (props.type === "newMyr" || props.type === "savedMyr") {
          response = await saveReports(
            modelYear,
            bytesToBase64(await report[0].xlsx.writeBuffer()),
            bytesToBase64(await forecasts[0].arrayBuffer()),
            forecasts[0].name,
          );
        } else if (
          props.type === "legacyNewSupp" ||
          props.type === "nonLegacyNewSupp"
        ) {
          response = await createSupplementary(modelYear, reportAsBase64);
        } else if (
          supplementaryId &&
          (props.type === "legacySavedSupp" ||
            props.type === "nonLegacySavedSupp")
        ) {
          response = await saveSupplementary(supplementaryId, reportAsBase64);
        }
        if (response && response.responseType === "error") {
          throw new Error(response.message);
        } else if (response && response.responseType === "data") {
          const responseData = response.data;
          if (typeof responseData === "number") {
            router.push(`${Routes.ComplianceReporting}/${responseData}`);
          } else {
            const { supplementaryId, myrId } = responseData;
            if (myrId) {
              router.push(
                `${Routes.ComplianceReporting}/${myrId}/supplementary/${supplementaryId}`,
              );
            } else {
              router.push(`${Routes.LegacySupplementary}/${supplementaryId}`);
            }
          }
        }
      } catch (e) {
        if (e instanceof Error) {
          setSaveError(e.message);
        }
      }
    });
  }, [props.type, supplementaryId, modelYear, report, forecasts]);

  const modelYearComponent: JSX.Element | null = useMemo(() => {
    let innerComponent;
    if (props.type === "legacyNewSupp") {
      innerComponent = (
        <select
          name="modelYear"
          value={modelYear}
          className="border p-2 w-full"
          onChange={(e) => {
            const value = e.target.value;
            setModelYear(isModelYear(value) ? value : undefined);
          }}
          disabled={!!report}
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
  }, [props.type, report, modelYear, modelYearsMap, legacyModelYearsMap]);

  return (
    <div>
      {modelYearComponent}
      <div className="flex items-center py-2 my-2">
        <label className="w-72" htmlFor="legalName">
          Legal Name
        </label>
        <input
          className="border p-2 w-full"
          name="legalName"
          type="text"
          value={legalName ?? ""}
          onChange={(e) => setLegalName(e.target.value)}
          disabled={!!report || isPending}
        />
      </div>
      <div className="flex items-center py-2 my-2">
        <label className="w-72" htmlFor="recordsAddress">
          Records Address
        </label>
        <input
          className="border p-2 w-full"
          name="recordsAddress"
          type="text"
          value={recordsAddress ?? ""}
          onChange={(e) => setRecordsAddress(e.target.value)}
          disabled={!!report || isPending}
        />
      </div>
      <div className="flex items-center py-2 my-2">
        <label className="w-72" htmlFor="serviceAddress">
          Service Address
        </label>
        <input
          className="border p-2 w-full"
          name="serviceAddress"
          type="text"
          value={serviceAddress ?? ""}
          onChange={(e) => setServiceAddress(e.target.value)}
          disabled={!!report || isPending}
        />
      </div>
      <div className="flex items-center py-2 my-2">
        <label className="w-72" htmlFor="makes">
          Makes
        </label>
        <input
          className="border p-2 w-full"
          name="makes"
          type="text"
          value={makes ?? ""}
          onChange={(e) => setMakes(e.target.value)}
          disabled={!!report || isPending}
        />
      </div>
      <VehicleStatsInput
        stats={vehicleStats}
        setStats={setVehicleStats}
        disabled={!!report || isPending}
      />
      <MyrNvValues
        nvValues={nvValues}
        handleChange={handleNvValuesChange}
        disabled={!!report || isPending}
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
          disabled={!!report || isPending}
        />
      </div>
      <Adjustments
        type="myr"
        adjustments={suggestedAdjustments}
        setAdjustments={setSuggestedAdjustments}
        disabled={!!report || isPending}
      />
      {generationError && <p className="text-red-600">{generationError}</p>}
      <div className="flex space-x-2">
        {report ? (
          <Button
            variant="secondary"
            onClick={handleClearMyr}
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
            {isPending ? "..." : "Generate your Report"}
          </Button>
        )}
      </div>
      {report && <ParsedModelYearReport myr={report[1]} />}
      {(props.type === "newMyr" || props.type === "savedMyr") &&
        forecasts.length === 0 && (
          <div className="flex space-x-2">
            <Button
              variant="secondary"
              onClick={handleDownloadForecastTemplate}
              disabled={isPending}
            >
              {isPending ? "..." : "Download Forecast Template"}
            </Button>
          </div>
        )}
      {(props.type === "newMyr" || props.type === "savedMyr") && (
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
      )}
      {saveError && <p className="text-red-600">{saveError}</p>}
      <div className="flex space-x-2">
        <Button variant="primary" onClick={handleSave} disabled={isPending}>
          {isPending ? "..." : "Save"}
        </Button>
      </div>
    </div>
  );
};
