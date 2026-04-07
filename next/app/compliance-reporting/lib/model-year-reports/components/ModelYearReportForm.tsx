"use client";

import axios, { AxiosResponse } from "axios";
import { Button } from "@/app/lib/components";
import { Dropdown } from "@/app/lib/components/inputs";
import { getModelYearEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
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
  createSupplementary,
  getForecastPutData,
  getForecastTemplateUrl,
  getMyrAttachmentsPutData,
  getMyrData,
  getMyrPutData,
  getMyrTemplateUrl,
  getSuppAttachmentsPutData,
  getSuppPutData,
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
import { Attachment, AttachmentDownload } from "@/app/lib/constants/attachment";
import { VehicleStatistic } from "../services";
import { Adjustment, Adjustments } from "./Adjustments";
import { isModelYear } from "@/app/lib/utils/typeGuards";
import { VehicleStatsInput } from "./VehicleStatsInputs";
import { SupplierData } from "../data";

type NewMyrProps = {
  type: "newMyr";
  modelYear: ModelYear;
  supplierData: SupplierData;
  vehicleStatistics: VehicleStatistic[];
};

type SavedMyrProps = {
  type: "savedMyr";
  myrId: number;
  modelYear: ModelYear;
  forecast: AttachmentDownload;
  myrUrl: string;
  attachments: AttachmentDownload[];
};

type NonLegacyNewSuppProps = {
  type: "nonLegacyNewSupp";
  myrId: number;
  modelYear: ModelYear;
  supplierData: SupplierData;
  vehicleStatistics: VehicleStatistic[];
};

type NonLegacySavedSuppProps = {
  type: "nonLegacySavedSupp";
  myrId: number;
  supplementaryId: number;
  modelYear: ModelYear;
  url: string;
  attachments: AttachmentDownload[];
};

type LegacyNewSuppProps = {
  type: "legacyNewSupp";
  supplierData: SupplierData;
};

type LegacySavedSuppProps = {
  type: "legacySavedSupp";
  supplementaryId: number;
  modelYear: ModelYear;
  url: string;
  attachments: AttachmentDownload[];
};

export const ModelYearReportForm = (
  props:
    | NewMyrProps
    | SavedMyrProps
    | NonLegacyNewSuppProps
    | NonLegacySavedSuppProps
    | LegacyNewSuppProps
    | LegacySavedSuppProps,
) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modelYear, setModelYear] = useState<ModelYear>();
  const [supplementaryId, setSupplementaryId] = useState<number>();
  const [myrId, setMyrId] = useState<number>();
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
  const [forecasts, setForecasts] = useState<File[]>([]);
  const [error, setError] = useState<string>("");
  const [attachments, setAttachments] = useState<File[]>([]);

  useEffect(() => {
    switch (props.type) {
      case "newMyr":
        setModelYear(props.modelYear);
        setLegalName(props.supplierData.legalName);
        setMakes(props.supplierData.makes);
        setRecordsAddress(props.supplierData.recordsAddress);
        setServiceAddress(props.supplierData.serviceAddress);
        setVehicleStats(getVehicleStatsAsStrings(props.vehicleStatistics));
        break;
      case "savedMyr":
        setMyrId(props.myrId);
        setModelYear(props.modelYear);
        break;
      case "nonLegacyNewSupp":
        setMyrId(props.myrId);
        setModelYear(props.modelYear);
        setLegalName(props.supplierData.legalName);
        setMakes(props.supplierData.makes);
        setRecordsAddress(props.supplierData.recordsAddress);
        setServiceAddress(props.supplierData.serviceAddress);
        setVehicleStats(getVehicleStatsAsStrings(props.vehicleStatistics));
        break;
      case "nonLegacySavedSupp":
        setMyrId(props.myrId);
        setSupplementaryId(props.supplementaryId);
        setModelYear(props.modelYear);
        break;
      case "legacyNewSupp":
        setLegalName(props.supplierData.legalName);
        setMakes(props.supplierData.makes);
        setRecordsAddress(props.supplierData.recordsAddress);
        setServiceAddress(props.supplierData.serviceAddress);
        break;
      case "legacySavedSupp":
        setSupplementaryId(props.supplementaryId);
        setModelYear(props.modelYear);
        break;
    }
  }, []);

  useEffect(() => {
    if (
      props.type === "savedMyr" ||
      props.type === "legacySavedSupp" ||
      props.type === "nonLegacySavedSupp"
    ) {
      const loadReports = async () => {
        let report: ParsedMyr | null = null;
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
            report = parsedMyr;
            setForecasts([forecastFile]);
          }
        } else {
          const files = await getFiles([{ fileName: "_", url: props.url }]);
          if (files.length === 1) {
            const supp = files[0];
            const suppWorkbook = await getWorkbook(supp.data);
            const parsedSupp = parseMyr(suppWorkbook);
            report = parsedSupp;
          }
        }
        if (report) {
          const savedDetails = report.supplierDetails;
          const savedVehicleStats = report.vehicleStatistics;
          setLegalName(savedDetails.legalName);
          setMakes(savedDetails.makes);
          setRecordsAddress(savedDetails.recordsAddress);
          setServiceAddress(savedDetails.serviceAddress);
          setVehicleStats(savedVehicleStats);
          setSuggestedAdjustments(report.suggestedAdjustments);
          setNvValues(getNvValues(report.complianceReductions));
          setZevClassSelection(
            getZevClassChoice(savedDetails.zevClassOrdering),
          );
        }
      };
      const loadAttachments = async () => {
        const attachmentsToLoad = props.attachments;
        if (attachmentsToLoad.length > 0) {
          const downloadedFiles = await getFiles(attachmentsToLoad);
          const attachmentsToSet = downloadedFiles.map((file) => {
            return new File([file.data], file.fileName);
          });
          setAttachments(attachmentsToSet);
        }
      };
      loadReports();
      loadAttachments();
    }
  }, []);

  useEffect(() => {
    if (props.type === "legacyNewSupp") {
      if (modelYear) {
        startTransition(async () => {
          const response = await retrieveVehicleStatistics(modelYear);
          const vehicleStats = getVehicleStatsAsStrings(response.data);
          setVehicleStats(vehicleStats);
        });
      } else {
        setVehicleStats([]);
      }
    }
  }, [props.type, modelYear]);

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

  const generateReport = useCallback(async () => {
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
    return workbook;
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

  const saveReport = useCallback(
    async (report: Workbook) => {
      if (!modelYear) {
        throw new Error("You must select a Model Year!");
      }
      const attachmentsToSave: Attachment[] = [];
      const numberOfAttachments = attachments.length;
      if (numberOfAttachments > 0) {
        let putData;
        switch (props.type) {
          case "newMyr":
          case "savedMyr":
            putData = await getMyrAttachmentsPutData(numberOfAttachments);
          case "nonLegacyNewSupp":
          case "nonLegacySavedSupp":
          case "legacyNewSupp":
          case "legacySavedSupp":
            putData = await getSuppAttachmentsPutData(numberOfAttachments);
        }
        const calls: Promise<AxiosResponse>[] = [];
        for (const [index, file] of attachments.entries()) {
          calls.push(
            axios.put(putData[index].url, file, {
              headers: { "if-none-match": "*" },
            }),
          );
          attachmentsToSave.push({
            objectName: putData[index].objectName,
            fileName: file.name,
          });
        }
        // will throw if at least one call fails
        await Promise.all(calls);
      }
      const reportBuf = await report.xlsx.writeBuffer();
      let response;
      switch (props.type) {
        case "newMyr":
        case "savedMyr":
          if (forecasts.length !== 1) {
            throw new Error("Exactly 1 Forecast Report expected!");
          }
          const forecastBuf = await forecasts[0].arrayBuffer();
          const forecastWorkbook = await getWorkbook(forecastBuf);
          validateForecastReport(forecastWorkbook, modelYear);
          const putData = await Promise.all([
            getMyrPutData(),
            getForecastPutData(),
          ]);
          await Promise.all([
            axios.put(putData[0].url, reportBuf, {
              headers: { "if-none-match": "*" },
            }),
            axios.put(putData[1].url, forecastBuf, {
              headers: { "if-none-match": "*" },
            }),
          ]);
          response = await saveReports(
            modelYear,
            putData[0].objectName,
            putData[1].objectName,
            forecasts[0].name,
            attachmentsToSave,
          );
          break;
        case "nonLegacyNewSupp":
        case "legacyNewSupp":
          const { url, objectName } = await getSuppPutData();
          await axios.put(url, reportBuf, {
            headers: { "if-none-match": "*" },
          });
          response = await createSupplementary(
            modelYear,
            objectName,
            attachmentsToSave,
          );
          break;
        case "nonLegacySavedSupp":
        case "legacySavedSupp":
          if (supplementaryId) {
            const { url, objectName } = await getSuppPutData();
            await axios.put(url, reportBuf, {
              headers: { "if-none-match": "*" },
            });
            response = await saveSupplementary(
              supplementaryId,
              objectName,
              attachmentsToSave,
            );
          }
          break;
      }
      if (response) {
        const responseType = response.responseType;
        if (responseType === "error") {
          throw new Error(response.message);
        } else {
          switch (props.type) {
            case "newMyr":
            case "savedMyr":
              if (responseType === "data") {
                router.push(`${Routes.ModelYearReports}/${response.data}`);
              }
              break;
            case "nonLegacyNewSupp":
              if (myrId && responseType === "data") {
                router.push(
                  `${Routes.ModelYearReports}/${myrId}/supplementary/${response.data}`,
                );
              }
              break;
            case "nonLegacySavedSupp":
              if (myrId && supplementaryId) {
                router.push(
                  `${Routes.ModelYearReports}/${myrId}/supplementary/${supplementaryId}`,
                );
              }
              break;
            case "legacyNewSupp":
              if (responseType === "data") {
                router.push(`${Routes.LegacySupplementary}/${response.data}`);
              }
              break;
            case "legacySavedSupp":
              if (supplementaryId) {
                router.push(`${Routes.LegacySupplementary}/${supplementaryId}`);
              }
              break;
          }
        }
      }
    },
    [props.type, myrId, supplementaryId, modelYear, forecasts, attachments],
  );

  const handleGenerateAndSaveReport = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        const report = await generateReport();
        await saveReport(report);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, [generateReport, saveReport]);

  const modelYearComponent: JSX.Element | null = useMemo(() => {
    let innerComponent;
    if (props.type === "legacyNewSupp") {
      innerComponent = (
        <Dropdown
          placeholder="Select an Option"
          options={Object.entries(legacyModelYearsMap).map(([key, value]) => ({
            value: value as string,
            label: key,
          }))}
          value={modelYear ?? ""}
          onChange={(value) => {
            setModelYear(isModelYear(value) ? value : undefined);
          }}
          disabled={isPending}
        />
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
          disabled={isPending}
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
          disabled={isPending}
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
          disabled={isPending}
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
          disabled={isPending}
        />
      </div>
      <VehicleStatsInput
        stats={vehicleStats}
        setStats={setVehicleStats}
        disabled={isPending}
      />
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
        type="myr"
        adjustments={suggestedAdjustments}
        setAdjustments={setSuggestedAdjustments}
        disabled={isPending}
      />
      {(props.type === "newMyr" || props.type === "savedMyr") && (
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
      <div className="flex items-center space-x-4">
        <span>Upload supporting documents here (optional; max 10):</span>
        <Dropzone
          files={attachments}
          setFiles={setAttachments}
          disabled={isPending}
          maxNumberOfFiles={10}
        />
      </div>
      {error && <p className="text-red-600">{error}</p>}
      <div className="flex space-x-2">
        <Button
          variant="primary"
          onClick={handleGenerateAndSaveReport}
          disabled={isPending}
        >
          {isPending ? "..." : "Generate Report and Save"}
        </Button>
      </div>
    </div>
  );
};
