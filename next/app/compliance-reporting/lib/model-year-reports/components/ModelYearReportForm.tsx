"use client";

import axios, { AxiosResponse } from "axios";
import { Button } from "@/app/lib/components";
import { Dropdown, TextInput } from "@/app/lib/components/inputs";
import { ModelYear, VehicleClass, ZevClass } from "@/prisma/generated/enums";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  createSupplementary,
  getForecastPutData,
  getMyrAttachmentsPutData,
  getMyrData,
  getMyrPutData,
  getMyrTemplateUrl,
  getSuppAttachmentsPutData,
  getSuppPutData,
  getVinListPutData,
  saveReports,
  saveSupplementary,
} from "../actions";
import {
  generateMyr,
  getAdjustmentsPayload,
  getNvValuesFromZevAndIceCounts,
  getWorkbook,
  validateForecastReport,
  validateVinList,
} from "../utilsClient";
import { getFiles } from "@/app/lib/utils/download";
import { Dropzone } from "@/app/lib/components/Dropzone";
import {
  legacyModelYearsMap,
  VinListError,
  ZevAndIceCounts,
} from "../constants";
import { Routes } from "@/app/lib/constants";
import { Workbook } from "exceljs";
import {
  getZevAndIceCounts,
  getZevClassOrder,
  ParsedMyr,
  parseMyr,
} from "../utils";
import { Attachment, AttachmentDownload } from "@/app/lib/constants/attachment";
import { Adjustment, Adjustments } from "./Adjustments";
import { isModelYear } from "@/app/lib/utils/typeGuards";
import { SupplierData } from "../data";
import { Makes } from "./Makes";
import { ForecastReportSubmission } from "./ForecastReportSubmission";
import { NvValuesSubmission } from "./NvValuesSubmission";
import { ZevClassOrder } from "./ZevClassOrder";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileArrowUp } from "@fortawesome/free-solid-svg-icons";
import { SupplierInformation } from "./SupplierInformation";
import { PreviousVolumes } from "./PreviousVolumes";
import { VinFileUpload } from "./VinFileUpload";

type NewMyrProps = {
  type: "newMyr";
  modelYear: ModelYear;
  supplierData: SupplierData;
  prevVolumes: { modelYear: string; volume: string }[];
};

type SavedMyrProps = {
  type: "savedMyr";
  mostRecentSupplierClass: string | null;
  myrId: number;
  modelYear: ModelYear;
  forecast: AttachmentDownload;
  vinList: AttachmentDownload;
  myrUrl: string;
  attachments: AttachmentDownload[];
};

type NonLegacyNewSuppProps = {
  type: "nonLegacyNewSupp";
  myrId: number;
  modelYear: ModelYear;
  supplierData: SupplierData;
};

type NonLegacySavedSuppProps = {
  type: "nonLegacySavedSupp";
  myrId: number;
  supplementaryId: number;
  modelYear: ModelYear;
  url: string;
  vinList: AttachmentDownload;
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
  vinList: AttachmentDownload;
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
  const [mostRecentSupplierClass, setMostRecentSupplierClass] =
    useState<string>();
  const [prevVolumes, setPrevVolumes] = useState<
    { modelYear: string; volume: string }[]
  >([]);
  const [makes, setMakes] = useState<string[]>([]);
  const [zevAndIceCounts, setZevAndIceCounts] = useState<ZevAndIceCounts>({});
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
  const [vinLists, setVinLists] = useState<File[]>([]);
  const [error, setError] = useState<string>("");
  const [vinListError, setVinListError] = useState<VinListError | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);

  useEffect(() => {
    switch (props.type) {
      case "newMyr":
        setModelYear(props.modelYear);
        setLegalName(props.supplierData.legalName);
        setMakes(props.supplierData.makes);
        setRecordsAddress(props.supplierData.recordsAddress);
        setServiceAddress(props.supplierData.serviceAddress);
        setMostRecentSupplierClass(
          props.supplierData.mostRecentSupplierClass ?? "",
        );
        setPrevVolumes(props.prevVolumes);
        break;
      case "savedMyr":
        setMyrId(props.myrId);
        setModelYear(props.modelYear);
        setMostRecentSupplierClass(props.mostRecentSupplierClass ?? "");
        break;
      case "nonLegacyNewSupp":
        setMyrId(props.myrId);
        setModelYear(props.modelYear);
        setLegalName(props.supplierData.legalName);
        setMakes(props.supplierData.makes);
        setRecordsAddress(props.supplierData.recordsAddress);
        setServiceAddress(props.supplierData.serviceAddress);
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
            props.vinList,
          ]);
          if (files.length === 3) {
            const myr = files[0];
            const forecast = files[1];
            const vinList = files[2];
            const myrWorkbook = await getWorkbook(myr.data);
            const parsedMyr = parseMyr(myrWorkbook);
            const forecastFile = new File([forecast.data], forecast.fileName);
            const vinListFile = new File([vinList.data], vinList.fileName);
            report = parsedMyr;
            setForecasts([forecastFile]);
            setVinLists([vinListFile]);
          }
        } else {
          const files = await getFiles([
            { fileName: "_", url: props.url },
            props.vinList,
          ]);
          if (files.length === 2) {
            const supp = files[0];
            const vinList = files[1];
            const suppWorkbook = await getWorkbook(supp.data);
            const parsedSupp = parseMyr(suppWorkbook);
            const vinListFile = new File([vinList.data], vinList.fileName);
            report = parsedSupp;
            setVinLists([vinListFile]);
          }
        }
        if (report) {
          const savedDetails = report.supplierDetails;
          setLegalName(savedDetails.legalName);
          setMakes(savedDetails.makes);
          setRecordsAddress(savedDetails.recordsAddress);
          setServiceAddress(savedDetails.serviceAddress);
          setPrevVolumes(report.previousVolumes);
          setSuggestedAdjustments(report.suggestedAdjustments);
          setZevAndIceCounts(getZevAndIceCounts(report.zevAndIceCounts));
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

  const handleZevAndIceCountsChange = useCallback(
    (vc: VehicleClass, type: "zev" | "ice", value: string) => {
      setZevAndIceCounts((prev) => {
        const prevCounts = prev[vc];
        const countsCopy = prevCounts
          ? { ...prevCounts }
          : { zev: "", ice: "" };
        if (type === "zev") {
          countsCopy["zev"] = value;
        } else {
          countsCopy["ice"] = value;
        }
        return { ...prev, [vc]: countsCopy };
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
    const nvValues = getNvValuesFromZevAndIceCounts(zevAndIceCounts);
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
      zevAndIceCounts,
      zevClassOrder,
      legalName,
      makes,
      recordsAddress,
      serviceAddress,
      adjustmentsPayload,
    );
    return workbook;
  }, [
    modelYear,
    legalName,
    makes,
    recordsAddress,
    serviceAddress,
    zevAndIceCounts,
    zevClassOrder,
    suggestedAdjustments,
  ]);

  const saveReport = useCallback(
    async (report: Workbook) => {
      if (!modelYear) {
        throw new Error("You must select a Model Year!");
      }
      if (vinLists.length !== 1) {
        throw new Error("Exactly 1 VIN List expected!");
      }
      const vinListBuf = await vinLists[0].arrayBuffer();
      const vinListWorkbook = await getWorkbook(vinListBuf);
      validateVinList(vinListWorkbook);
      const vinListPutData = await getVinListPutData();
      await axios.put(vinListPutData.url, vinListBuf, {
        headers: { "if-none-match": "*" },
      });
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
            vinListPutData.objectName,
            vinLists[0].name,
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
            vinListPutData.objectName,
            vinLists[0].name,
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
              vinListPutData.objectName,
              vinLists[0].name,
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
    [
      props.type,
      myrId,
      supplementaryId,
      modelYear,
      forecasts,
      vinLists,
      attachments,
    ],
  );

  const handleGenerateAndSaveReport = useCallback(() => {
    setError("");
    setVinListError(null);
    startTransition(async () => {
      try {
        const report = await generateReport();
        await saveReport(report);
      } catch (e) {
        if (e instanceof VinListError) {
          setVinListError(e);
          setError("VIN List Error! Please see the VIN list section above.");
        } else if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, [generateReport, saveReport]);

  return (
    <div className="flex flex-col gap-4">
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
        <div className="flex flex-col gap-4">
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
        </div>
      )}
      {(props.type === "newMyr" || props.type === "savedMyr") && modelYear && (
        <div className="flex flex-row gap-6">
          <div className="flex-1">
            <SupplierInformation
              legalName={legalName ?? ""}
              recordsAddress={recordsAddress ?? ""}
              serviceAddress={serviceAddress ?? ""}
              classification={mostRecentSupplierClass}
            />
          </div>
          <div className="flex-1">
            <PreviousVolumes modelYear={modelYear} volumes={prevVolumes} />
          </div>
        </div>
      )}
      <Makes
        makes={makes}
        setMakes={setMakes}
        disabled={isPending}
        supplierName={legalName}
      />
      {modelYear && (
        <VinFileUpload
          modelYear={modelYear}
          vinLists={vinLists}
          setVinLists={setVinLists}
          disabled={isPending}
          vinListError={vinListError}
          setVinListError={setVinListError}
        />
      )}
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
          zevAndIceCounts={zevAndIceCounts}
          handleZevAndIceCountsChange={handleZevAndIceCountsChange}
          disabled={isPending}
        />
      )}
      {modelYear && (
        <ZevClassOrder
          modelYear={modelYear}
          zevClassOrder={zevClassOrder}
          setZevClassOrder={setZevClassOrder}
          disabled={isPending}
          showBalance={props.type === "newMyr" || props.type === "savedMyr"}
        />
      )}
      {props.type !== "newMyr" && props.type !== "savedMyr" && (
        <div className="flex flex-col gap-4">
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
      <div className="flex flex-row p-5 bg-lightGrey justify-between">
        <span></span>
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
