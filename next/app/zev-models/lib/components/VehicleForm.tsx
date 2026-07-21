"use client";

import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import {
  useState,
  useCallback,
  useTransition,
  useMemo,
  useEffect,
} from "react";
import { useRouter } from "next/navigation";
import { getVehicleAttachmentsPutData, supplierSave } from "../actions";
import { Routes } from "@/app/lib/constants";
import { ModelYear, ZevType } from "@/prisma/generated/enums";
import { getVehiclePayload, gvwrCheck, rangeCheck } from "../utilsClient";
import {
  getStringsToModelYearsEnumsMap,
  getStringsToVehicleClassCodeEnumsMap,
} from "@/app/lib/utils/enumMaps";
import { Dropzone } from "@/app/lib/components/Dropzone";
import { FileWithPath } from "react-dropzone";
import { Button, StatusBanner } from "@/app/lib/components";
import { Dropdown } from "@/app/lib/components/inputs";
import { Attachment, AttachmentDownload } from "@/app/lib/constants/attachment";
import { getDefaultAttchmentTypes } from "@/app/lib/utils/attachments";
import { getFiles } from "@/app/lib/utils/download";
import { TextInput } from "@/app/lib/components/inputs";

export type VehicleFormData = {
  modelYear?: string;
  make?: string;
  modelName?: string;
  zevType?: string;
  range?: string;
  bodyType?: string;
  gvwr?: string;
  us06?: string;
};

export const VehicleForm = (props: {
  vehicle?: { id: number; attachments: AttachmentDownload[] } & VehicleFormData;
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [responsiveError, setResponsiveError] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [formData, setFormData] = useState<VehicleFormData>({});
  const [files, setFiles] = useState<FileWithPath[]>([]);
  const modelYearsMap = useMemo(() => {
    return getStringsToModelYearsEnumsMap();
  }, []);
  const allowedFileTypes = useMemo(() => {
    return getDefaultAttchmentTypes();
  }, []);

  useEffect(() => {
    const initializeForm = async () => {
      const vehicle = props.vehicle;
      if (vehicle) {
        const formDataToSet = {
          modelYear: vehicle.modelYear,
          make: vehicle.make,
          modelName: vehicle.modelName,
          zevType: vehicle.zevType,
          range: vehicle.range,
          bodyType: vehicle.bodyType,
          gvwr: vehicle.gvwr,
          us06: vehicle.us06,
        };
        setFormData(formDataToSet);
        const attachments = vehicle.attachments;
        if (attachments.length > 0) {
          const downloadedFiles = await getFiles(attachments);
          const filesToSet = downloadedFiles.map((file) => {
            return new File([file.data], file.fileName);
          });
          setFiles(filesToSet);
        }
      }
    };
    initializeForm();
  }, []);

  useEffect(() => {
    const gvwr = formData.gvwr;
    if (gvwr !== undefined && gvwr !== "") {
      try {
        gvwrCheck(gvwr);
      } catch (e) {
        if (e instanceof Error) {
          setResponsiveError(e.message);
          return;
        }
      }
      setResponsiveError("");
    } else {
      setResponsiveError("");
    }
  }, [formData.gvwr]);

  useEffect(() => {
    const range = formData.range;
    if (range !== undefined && range !== "") {
      try {
        rangeCheck(range);
      } catch (e) {
        if (e instanceof Error) {
          setResponsiveError(e.message);
          return;
        }
      }
      setResponsiveError("");
    } else {
      setResponsiveError("");
    }
  }, [formData.range]);

  const classCodesMap = useMemo(() => {
    return getStringsToVehicleClassCodeEnumsMap();
  }, []);

  const handleChange = useCallback((key: string, value: string) => {
    setFormData((prev) => {
      return { ...prev, [key]: value };
    });
  }, []);

  const handleSubmit = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        const vehiclePayload = getVehiclePayload(formData);
        if (vehiclePayload.us06RangeGte16 && files.length === 0) {
          throw new Error("Certificate upload required!");
        }
        const attachments: Attachment[] = [];
        if (files.length > 0) {
          const putData = await getVehicleAttachmentsPutData(files.length);
          for (const [index, file] of files.entries()) {
            const putDatum = putData[index];
            await axios.put(putDatum.url, file, {
              headers: { "if-none-match": "*" },
            });
            attachments.push({
              fileName: file.name,
              objectName: putDatum.objectName,
            });
          }
        }
        const response = await supplierSave(
          vehiclePayload,
          attachments,
          props.vehicle?.id,
        );
        if (response.responseType === "error") {
          throw new Error(response.message);
        }
        const vehicleId = response.data;
        router.push(`${Routes.SubmittedZevModels}/${vehicleId}`);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, [formData, files, props.vehicle]);

  const modelYearOptions = Object.entries(modelYearsMap)
    .filter(
      ([_key, value]) =>
        value && value >= ModelYear.MY_2019 && value <= ModelYear.MY_2035,
    )
    .map(([key, value]) => ({
      value: value as string,
      label: key,
    }));

  const zevTypeOptions = Object.keys(ZevType).map((zevType) => ({
    value: zevType,
    label: zevType,
  }));

  const bodyTypeOptions = Object.keys(classCodesMap).map((classCode) => ({
    value: classCode,
    label: classCode,
  }));

  return (
    <div className="space-y-6">
      <section className="overflow-visible rounded border border-dividerMedium/30 bg-white shadow-level-1">
        <h2 className="bg-[#eeeceb] px-5 py-4 text-xl font-bold text-black">
          Vehicle Details
        </h2>
        <div className="space-y-6 p-5">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <Dropdown
              id="modelYear"
              label="Model Year"
              placeholder="Select an option"
              options={modelYearOptions}
              value={formData.modelYear ?? ""}
              onChange={(value) => handleChange("modelYear", value)}
            />
            <Dropdown
              id="zevType"
              label="ZEV Type"
              placeholder="Select an option"
              options={zevTypeOptions}
              value={formData.zevType ?? ""}
              onChange={(value) => handleChange("zevType", value)}
            />
            <Dropdown
              id="bodyType"
              label="Body Type"
              placeholder="Select an option"
              options={bodyTypeOptions}
              value={formData.bodyType ?? ""}
              onChange={(value) => handleChange("bodyType", value)}
            />
          </div>

          {responsiveError && (
            <StatusBanner
              variant="error"
              title={responsiveError}
              primaryText=""
            />
          )}

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            <TextInput
              label="Make"
              value={formData.make ?? ""}
              onChange={(value) => handleChange("make", value)}
            />
            <TextInput
              label="Model Name"
              value={formData.modelName ?? ""}
              onChange={(value) => handleChange("modelName", value)}
            />
            <TextInput
              label="GVWR (kg)"
              type="number"
              value={formData.gvwr ?? ""}
              onChange={(value) => handleChange("gvwr", value)}
            />
            <TextInput
              label="Electric EPA Range (km)"
              placeholder="Enter value"
              type="number"
              value={formData.range ?? ""}
              onChange={(value) => handleChange("range", value)}
            />
          </div>

          <label
            htmlFor="us06"
            className="flex cursor-pointer items-start gap-3 rounded border border-dividerMedium px-4 py-4"
          >
            <input
              type="checkbox"
              id="us06"
              className="mt-1 h-4 w-4 rounded border-dividerDark text-primaryBlue focus:ring-primaryBlue"
              checked={formData.us06 === "true"}
              onChange={(e) => {
                handleChange(e.target.id, e.target.checked ? "true" : "false");
              }}
            />
            <span>
              <span className="block font-bold text-primaryText">
                Claim Additional US06 0.2 credit
              </span>
              <span className="mt-2 block text-sm text-primaryText">
                Requires certificate upload!
              </span>
            </span>
          </label>
        </div>
      </section>

      <section className="overflow-visible rounded border border-dividerMedium/30 bg-white shadow-level-1">
        <h2 className="bg-[#eeeceb] px-5 py-4 text-xl font-bold text-black">
          Supporting Documents (optional)
        </h2>
        <div className="p-5">
          {files.length > 0 && (
            <StatusBanner
              title="File(s) uploaded successfully."
              primaryText="Review the data below before saving."
            />
          )}
          <Dropzone
            files={files}
            setFiles={setFiles}
            disabled={isPending}
            maxNumberOfFiles={10}
            allowedFileTypes={allowedFileTypes}
          />
        </div>
      </section>

      {error && <StatusBanner variant="error" title={error} primaryText="" />}

      <div className="flex items-center justify-between bg-gray-100 p-5">
        <Button
          type="button"
          variant="secondary"
          icon={<FontAwesomeIcon icon={faArrowLeft} className="h-3.5 w-3.5" />}
          iconPosition="left"
          className="border-primaryBlue bg-white font-semibold text-primaryText hover:border-primaryBlue hover:text-primaryText active:text-primaryText"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Back
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={isPending}
          icon={<FontAwesomeIcon icon={faFloppyDisk} className="h-3.5 w-3.5" />}
          iconPosition="right"
          className="font-semibold"
        >
          {isPending ? "..." : "Save"}
        </Button>
      </div>
    </div>
  );
};
