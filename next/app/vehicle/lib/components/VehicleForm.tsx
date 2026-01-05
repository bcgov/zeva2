"use client";

import { useState, useCallback, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  submitVehicle,
  getPutObjectData,
  VehiclePutObjectData,
} from "../actions";
import { Routes } from "@/app/lib/constants";
import { VehicleClassCode, VehicleZevType } from "@/prisma/generated/client";
import { getVehiclePayload } from "../utilsClient";
import { getStringsToModelYearsEnumsMap } from "@/app/lib/utils/enumMaps";
import { Dropzone } from "@/app/lib/components/Dropzone";
import axios from "axios";
import { FileWithPath } from "react-dropzone";
import { Button } from "@/app/lib/components";
import { getNormalizedComment } from "@/app/lib/utils/comment";
import { Attachment } from "@/app/lib/services/attachments";
import { getDefaultAttchmentTypes } from "@/app/lib/utils/attachments";

export const VehicleForm = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");
  const [formData, setFormData] = useState<Partial<Record<string, string>>>({});
  const [files, setFiles] = useState<FileWithPath[]>([]);
  const [comment, setComment] = useState<string>("");
  const modelYearsMap = useMemo(() => {
    return getStringsToModelYearsEnumsMap();
  }, []);
  const allowedFileTypes = useMemo(() => {
    return getDefaultAttchmentTypes();
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
        const vehiclePayload = getVehiclePayload(formData, files);
        const vehicleFiles: Attachment[] = [];
        if (files.length > 0) {
          const putData = await getPutObjectData(files.length);
          const filesAndPutData: [FileWithPath, VehiclePutObjectData][] =
            files.map((file, index) => [file, putData[index]]);
          for (const tuple of filesAndPutData) {
            const file = tuple[0];
            const putData = tuple[1];
            await axios.put(putData.url, file);
            vehicleFiles.push({
              fileName: file.name,
              objectName: putData.objectName,
            });
          }
        }
        const response = await submitVehicle(
          vehiclePayload,
          vehicleFiles,
          getNormalizedComment(comment),
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
  }, [formData, files, comment]);

  return (
    <div>
      {error && <p className="text-red-600">{error}</p>}
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
          {Object.keys(VehicleZevType).map((zevType) => (
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
          {Object.keys(VehicleClassCode).map((classCode) => (
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
      <textarea
        className="w-full border  p-2"
        rows={3}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Optional Comment"
        disabled={isPending}
      />
      <div className="flex space-x-2">
        <Button variant="primary" onClick={handleSubmit} disabled={isPending}>
          {isPending ? "..." : "Submit"}
        </Button>
      </div>
    </div>
  );
};
