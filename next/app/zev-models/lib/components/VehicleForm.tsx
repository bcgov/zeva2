"use client";

import axios from "axios";
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
import { getVehiclePayload } from "../utilsClient";
import {
  getStringsToModelYearsEnumsMap,
  getStringsToVehicleClassCodeEnumsMap,
} from "@/app/lib/utils/enumMaps";
import { Dropzone } from "@/app/lib/components/Dropzone";
import { FileWithPath } from "react-dropzone";
import { Button } from "@/app/lib/components";
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
        if (attachments.length > 0 && vehicle.us06 === "true") {
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

  const classCodesMap = useMemo(() => {
    return getStringsToVehicleClassCodeEnumsMap();
  }, []);

  const handleChange = useCallback((key: string, value: string) => {
    if (key === "us06" && value === "false") {
      setFiles([]);
    }
    setFormData((prev) => {
      return { ...prev, [key]: value };
    });
  }, []);

  const handleSubmit = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        const vehiclePayload = getVehiclePayload(formData);
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
        router.push(`${Routes.InactiveZevModels}/${vehicleId}`);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, [formData, files, props.vehicle]);

  return (
    <div>
      <div className="flex items-center py-2 my-2">
        <div className="w-72">
          <label>Model Year</label>
        </div>
        <div className="w-full">
          <Dropdown
            id="modelYear"
            placeholder="Select an Option"
            options={Object.entries(modelYearsMap)
              .filter(
                ([_key, value]) =>
                  value &&
                  value >= ModelYear.MY_2019 &&
                  value <= ModelYear.MY_2035,
              )
              .map(([key, value]) => ({
                value: value as string,
                label: key,
              }))}
            value={formData.modelYear ?? ""}
            onChange={(value) => handleChange("modelYear", value)}
          />
        </div>
      </div>
      <div className="py-2 my-2">
        <TextInput
          label="Make"
          value={formData.make ?? ""}
          onChange={(value) => handleChange("make", value)}
        />
      </div>
      <div className="py-2 my-2">
        <TextInput
          label="Model Name"
          value={formData.modelName ?? ""}
          onChange={(value) => handleChange("modelName", value)}
        />
      </div>
      <div className="flex items-center py-2 my-2">
        <div className="w-72">
          <label>ZEV Type</label>
        </div>
        <div className="w-full">
          <Dropdown
            id="zevType"
            placeholder="Select an Option"
            options={Object.keys(ZevType).map((zevType) => ({
              value: zevType,
              label: zevType,
            }))}
            value={formData.zevType ?? ""}
            onChange={(value) => handleChange("zevType", value)}
          />
        </div>
      </div>
      <div className="py-2 my-2">
        <TextInput
          label="Electric EPA Range (km)"
          type="number"
          value={formData.range ?? ""}
          onChange={(value) => handleChange("range", value)}
        />
      </div>
      <div className="flex items-center py-2 my-2">
        <div className="w-72">
          <label>Body Type</label>
        </div>
        <div className="w-full">
          <Dropdown
            id="bodyType"
            placeholder="Select an Option"
            options={Object.keys(classCodesMap).map((classCode) => ({
              value: classCode,
              label: classCode,
            }))}
            value={formData.bodyType ?? ""}
            onChange={(value) => handleChange("bodyType", value)}
          />
        </div>
      </div>
      <div className="py-2 my-2">
        <TextInput
          label="GVWR (kg)"
          type="number"
          value={formData.gvwr ?? ""}
          onChange={(value) => handleChange("gvwr", value)}
        />
      </div>
      <div className="flex items-center space-x-4">
        <span>Claim Additional US06 0.2 credit</span>
        <input
          type="checkbox"
          id="us06"
          checked={formData.us06 === "true"}
          onChange={(e) => {
            handleChange(e.target.id, e.target.checked ? "true" : "false");
          }}
        />
        <span>(requires certificate upload)</span>
      </div>
      {formData.us06 === "true" && (
        <Dropzone
          files={files}
          setFiles={setFiles}
          disabled={isPending}
          maxNumberOfFiles={10}
          allowedFileTypes={allowedFileTypes}
        />
      )}
      {error && <p className="text-red-600">{error}</p>}
      <div className="flex space-x-2">
        <Button variant="primary" onClick={handleSubmit} disabled={isPending}>
          {isPending ? "..." : "Save"}
        </Button>
      </div>
    </div>
  );
};
