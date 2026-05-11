"use client";

import axios, { AxiosResponse } from "axios";
import { Button } from "@/app/lib/components";
import { Dropdown, TextInput } from "@/app/lib/components/inputs";
import { ModelYear, VehicleClass, ZevClass } from "@/prisma/generated/enums";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  createSupplementary,
  deleteReports,
  deleteSupplementary,
  getForecastPutData,
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
  validateForecastReport,
  validateNvValues,
} from "../utilsClient";
import { getFiles } from "@/app/lib/utils/download";
import { Dropzone } from "@/app/lib/components/Dropzone";
import { legacyModelYearsMap } from "../constants";
import { Routes } from "@/app/lib/constants";
import { Workbook } from "exceljs";
import {
  getNvValues,
  getVehicleStatsAsStrings,
  getZevClassOrder,
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
import { Makes } from "./Makes";
import { ForecastReportSubmission } from "./ForecastReportSubmission";
import { NvValuesSubmission } from "./NvValuesSubmission";
import { ZevClassOrder } from "./ZevClassOrder";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faFileArrowUp } from "@fortawesome/free-solid-svg-icons";

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
  const [makes, setMakes] = useState<string[]>([]);
  const [vehicleStats, setVehicleStats] = useState<VehicleStatString[]>([]);
  const [nvValues, setNvValues] = useState<NvValues>({});
  const [zevClassOrder, setZevClassOrder] = useState<ZevClass[]>([
    ZevClass.UNSPECIFIED,
    ZevClass.B,
    ZevClass.A,
    ZevClass.C,
  ]);
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
          setZevClassOrder(getZevClassOrder(savedDetails.zevClassOrdering));
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

  const handleNvValuesChange = useCallback(
    (vc: VehicleClass, value: string) => {
      setNvValues((prev) => {
        return { ...prev, [vc]: value };
      });
    },
    [],
  );

  const generateReport = useCallback(async () => {
    if (!modelYear) {
      throw new Error("Please select a model year!");
    }
    if (!legalName || !serviceAddress || !recordsAddress) {
      throw new Error(
        "On the Administration page, please ensure your organization has a legal name, a service address, and a records address!",
      );
    }
    if (makes.length === 0) {
      throw new Error("You must enter at least one vehicle make!");
    }
    for (const make of makes) {
      if (make.includes("|")) {
        throw new Error("A vehicle make may not contain the pipe symbol!");
      }
    }
    validateNvValues(nvValues);
    const adjustmentsPayload = getAdjustmentsPayload(suggestedAdjustments);
    const [templateUrl, myrDataResponse] = await Promise.all([
      getMyrTemplateUrl(),
      getMyrData(modelYear, nvValues, zevClassOrder, adjustmentsPayload),
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
      zevClassOrder,
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
    zevClassOrder,
    suggestedAdjustments,
  ]);

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

  const handleDeleteReport = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        let response;
        if (
          (props.type === "legacySavedSupp" ||
            props.type === "nonLegacySavedSupp") &&
          supplementaryId
        ) {
          response = await deleteSupplementary(supplementaryId);
        } else if (props.type === "savedMyr" && myrId) {
          response = await deleteReports(myrId);
        }
        if (response) {
          const responseType = response.responseType;
          if (responseType === "error") {
            throw new Error(response.message);
          } else {
            if (props.type === "legacySavedSupp") {
              router.push(Routes.LegacySupplementary);
            } else if (props.type === "nonLegacySavedSupp") {
              router.push(
                `${Routes.ModelYearReports}/${myrId}/reassessments-and-supplementaries`,
              );
            } else if (props.type === "savedMyr") {
              router.push(Routes.ModelYearReports);
            }
          }
        }
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, [props.type, myrId, supplementaryId]);

  return (
    <div className="flex flex-col gap-2">
      {props.type === "legacyNewSupp" && (
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
      )}
      {props.type !== "newMyr" && props.type !== "savedMyr" && (
        <div className="flex flex-col gap-2">
          <TextInput
            label="Legal Name"
            value={legalName ?? ""}
            onChange={setLegalName}
            disabled={isPending}
          />
          <TextInput
            label="Records Address"
            value={recordsAddress ?? ""}
            onChange={setRecordsAddress}
            disabled={isPending}
          />
          <TextInput
            label="Service Address"
            value={serviceAddress ?? ""}
            onChange={setServiceAddress}
            disabled={isPending}
          />
          <VehicleStatsInput
            stats={vehicleStats}
            setStats={setVehicleStats}
            disabled={isPending}
          />
          <Adjustments
            type="myr"
            adjustments={suggestedAdjustments}
            setAdjustments={setSuggestedAdjustments}
            disabled={isPending}
          />
          <div className="flex flex-col gap-2">
            <span>Upload supporting documents here (optional; max 10):</span>
            <Dropzone
              files={attachments}
              setFiles={setAttachments}
              disabled={isPending}
              maxNumberOfFiles={10}
            />
          </div>
        </div>
      )}
      <Makes makes={makes} setMakes={setMakes} disabled={isPending} />
      {(props.type === "newMyr" || props.type === "savedMyr") && modelYear && (
        <ForecastReportSubmission
          modelYear={modelYear}
          forecasts={forecasts}
          setForecasts={setForecasts}
          disabled={isPending}
        />
      )}
      {modelYear && (
        <NvValuesSubmission
          modelYear={modelYear}
          nvValues={nvValues}
          handleNvValuesChange={handleNvValuesChange}
          disabled={isPending}
        />
      )}
      {modelYear && (
        <ZevClassOrder
          modelYear={modelYear}
          zevClassOrder={zevClassOrder}
          setZevClassOrder={setZevClassOrder}
          disabled={isPending}
        />
      )}
      <div className="flex flex-row p-2 bg-gray-50 justify-between">
        {props.type === "legacySavedSupp" ||
        props.type === "nonLegacySavedSupp" ||
        props.type === "savedMyr" ? (
          <Button
            onClick={handleDeleteReport}
            variant="danger"
            disabled={isPending}
            icon={<FontAwesomeIcon icon={faTrash} />}
            iconPosition="right"
          >
            Delete
          </Button>
        ) : (
          <span></span>
        )}
        <div className="flex flex-row gap-1 items-center">
          {error && <span className="text-red-600">{error}</span>}
          <Button
            onClick={handleGenerateAndSaveReport}
            variant="primary"
            disabled={isPending}
            icon={<FontAwesomeIcon icon={faFileArrowUp} />}
            iconPosition="right"
          >
            {props.type === "legacyNewSupp" ||
            props.type === "newMyr" ||
            props.type === "nonLegacyNewSupp"
              ? "Generate Report"
              : "Regenerate Report"}
          </Button>
        </div>
      </div>
    </div>
  );
};
