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
import { ZevType } from "@/prisma/generated/client";
import { getVehiclePayload } from "../utilsClient";
import {
  getStringsToModelYearsEnumsMap,
  getStringsToVehicleClassCodeEnumsMap,
} from "@/app/lib/utils/enumMaps";
import { Dropzone } from "@/app/lib/components/Dropzone";
import { FileWithPath } from "react-dropzone";
import { Button } from "@/app/lib/components";
import { Attachment, AttachmentDownload } from "@/app/lib/services/attachments";
import { getDefaultAttchmentTypes } from "@/app/lib/utils/attachments";
import { getFiles } from "@/app/lib/utils/download";

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
  }, [props.vehicle]);

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
            await axios.put(putDatum.url, file);
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
        router.push(`${Routes.Vehicle}/${vehicleId}`);
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
        <label htmlFor="modelYear" className="w-72">
          Model Year
        </label>
        <select
          id="modelYear"
          className="border p-2 w-full"
          value={formData.modelYear}
          onChange={(e) => {
            handleChange(e.target.id, e.target.value);
          }}
        >
          <option value="">--</option>
          {Object.entries(modelYearsMap).map(([key, value]) => (
            <option key={value} value={value}>
              {key}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center py-2 my-2">
        <label htmlFor="make" className="w-72">
          Make
        </label>
        <input
          id="make"
          type="text"
          onChange={(e) => {
            handleChange(e.target.id, e.target.value);
          }}
          value={formData.make ?? ""}
          className="border p-2 w-full"
        />
      </div>
      <div className="flex items-center py-2 my-2">
        <label htmlFor="modelName" className="w-72">
          Model Name
        </label>
        <input
          id="modelName"
          type="text"
          value={formData.modelName ?? ""}
          onChange={(e) => {
            handleChange(e.target.id, e.target.value);
          }}
          className="border p-2 w-full"
        />
      </div>
      <div className="flex items-center py-2 my-2">
        <label htmlFor="zevType" className="w-72">
          ZEV Type
        </label>
        <select
          id="zevType"
          value={formData.zevType}
          className="border p-2 w-full"
          onChange={(e) => {
            handleChange(e.target.id, e.target.value);
          }}
        >
          <option value="">--</option>
          {Object.keys(ZevType).map((zevType) => (
            <option key={zevType} value={zevType}>
              {zevType}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center py-2 my-2">
        <label htmlFor="range" className="w-72">
          Electric EPA Range (km)
        </label>
        <input
          id="range"
          type="text"
          value={formData.range ?? ""}
          className="border p-2 w-full"
          onChange={(e) => {
            handleChange(e.target.id, e.target.value);
          }}
        />
      </div>
      <div className="flex items-center py-2 my-2">
        <label htmlFor="bodyType" className="w-72">
          Body Type
        </label>
        <select
          id="bodyType"
          value={formData.bodyType}
          className="border p-2 w-full"
          onChange={(e) => {
            handleChange(e.target.id, e.target.value);
          }}
        >
          <option value="">--</option>
          {Object.keys(classCodesMap).map((classCode) => (
            <option key={classCode} value={classCode}>
              {classCode}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center py-2 my-2">
        <label htmlFor="gvwr" className="w-72">
          GVWR (kg)
        </label>
        <input
          id="gvwr"
          type="text"
          value={formData.gvwr ?? ""}
          className="border p-2 w-full"
          onChange={(e) => {
            handleChange(e.target.id, e.target.value);
          }}
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
