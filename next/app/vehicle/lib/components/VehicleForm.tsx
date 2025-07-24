"use client";

import {
  useState,
  useCallback,
  useTransition,
  useMemo,
  useEffect,
} from "react";
import { useRouter } from "next/navigation";
import {
  createOrUpdateVehicle,
  getPutObjectData,
  VehicleFile,
  VehiclePutObjectData,
} from "../actions";
import { Routes } from "@/app/lib/constants";
import {
  VehicleClassCode,
  VehicleStatus,
  VehicleZevType,
} from "@/prisma/generated/client";
import { getVehiclePayload } from "../utilsClient";
import { SerializedVehicleWithOrg } from "../data";
import { getModelYearEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { Dropzone } from "@/app/lib/components/Dropzone";
import axios from "axios";
import { FileWithPath } from "react-dropzone";

export function VehicleForm(props: { vehicle?: SerializedVehicleWithOrg }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");
  const [formData, setFormData] = useState<Partial<Record<string, string>>>({});
  const [files, setFiles] = useState<FileWithPath[]>([]);
  const modelYearsMap = useMemo(() => {
    return getModelYearEnumsToStringsMap();
  }, []);
  const allowedFileTypes = {
    "application/msword": [".doc", ".docx"],
    "application/vnd.ms-excel": [".xls", ".xlsx"],
    "application/pdf": [".pdf"],
    "image/jpeg": [".jpg"],
    "image/png": [".png"],
  };

  useEffect(() => {
    const vehicle = props.vehicle;
    if (vehicle) {
      // read vehicle data into formData
      setFormData({
        modelYear: modelYearsMap[vehicle.modelYear],
        make: vehicle.make,
        modelName: vehicle.modelName,
        zevType: vehicle.vehicleZevType,
        us06: vehicle.hasPassedUs06Test.toString(),
        range: vehicle.range.toString(),
        bodyType: vehicle.vehicleClassCode,
        gvwr: vehicle.weightKg,
      });
    }
  }, [props.vehicle]);

  const handleChange = useCallback((key: string, value: string) => {
    if (
      (key === "zevType" && value !== "EREV") ||
      (key === "us06" && value === "false")
    ) {
      setFiles([]);
      setFormData((prev) => {
        return { ...prev, [key]: value, us06: "false" };
      });
    } else {
      setFormData((prev) => {
        return { ...prev, [key]: value };
      });
    }
  }, []);

  const handleSubmit = useCallback(
    (status: VehicleStatus) => {
      setError("");
      startTransition(async () => {
        try {
          const vehiclePayload = getVehiclePayload(formData, files, status);
          if (props.vehicle) {
            vehiclePayload.id = props.vehicle.id;
          }
          const vehicleFiles: VehicleFile[] = [];
          if (files.length > 0) {
            const putData = await getPutObjectData(files.length);
            const filesAndPutData: [FileWithPath, VehiclePutObjectData][] =
              files.map((file, index) => [file, putData[index]]);
            for (const tuple of filesAndPutData) {
              const file = tuple[0];
              const putData = tuple[1];
              await axios.put(putData.url, file);
              vehicleFiles.push({
                filename: file.name,
                objectName: putData.objectName,
                size: file.size,
                mimeType: file.type,
              });
            }
          }
          const response = await createOrUpdateVehicle(
            vehiclePayload,
            vehicleFiles,
          );
          if (response.responseType === "error") {
            throw new Error(response.message);
          }
          const vehicleId = response.data;
          router.push(
            `${Routes.Vehicle}/${vehicleId ? vehicleId : vehiclePayload.id}`,
          );
        } catch (e) {
          if (e instanceof Error) {
            setError(e.message);
          }
        }
      });
    },
    [formData, props.vehicle, files],
  );

  const button = useMemo(() => {
    let status: VehicleStatus = VehicleStatus.DRAFT;
    let label = "Save Draft";
    if (props.vehicle) {
      status = props.vehicle.status;
      label = "Save";
    }
    return (
      <button
        type="button"
        disabled={isPending}
        onClick={() => handleSubmit(status)}
      >
        {isPending ? "..." : label}
      </button>
    );
  }, [props.vehicle, isPending, handleSubmit]);

  if (
    props.vehicle &&
    props.vehicle.status !== VehicleStatus.DRAFT &&
    props.vehicle.status !== VehicleStatus.CHANGES_REQUESTED
  ) {
    return (
      <div className="p-6 font-semibold">This vehicle cannot be modified.</div>
    );
  }
  return (
    <div>
      {error && <p className="text-red-600">{error}</p>}
      <div className="flex items-center py-2 my-2">
        <label className="w-72">Model Year</label>
        <select
          name="modelYear"
          className="border p-2 w-full"
          value={formData.modelYear}
          onChange={(e) => {
            handleChange(e.target.name, e.target.value);
          }}
        >
          <option value="">--</option>
          {Object.values(modelYearsMap).map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center py-2 my-2">
        <label className="w-72">Make</label>
        <input
          name="make"
          type="text"
          onChange={(e) => {
            handleChange(e.target.name, e.target.value);
          }}
          value={formData.make ?? ""}
          className="border p-2 w-full"
        />
      </div>
      <div className="flex items-center py-2 my-2">
        <label className="w-72">Model Name</label>
        <input
          name="modelName"
          type="text"
          value={formData.modelName ?? ""}
          onChange={(e) => {
            handleChange(e.target.name, e.target.value);
          }}
          className="border p-2 w-full"
        />
      </div>
      <div className="flex items-center py-2 my-2">
        <label className="w-72">ZEV Type</label>
        <select
          name="zevType"
          value={formData.zevType}
          className="border p-2 w-full"
          onChange={(e) => {
            handleChange(e.target.name, e.target.value);
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

      <div className="flex items-center space-x-4">
        <span>Claim Additional US06 0.2 credit</span>
        <input
          type="checkbox"
          name="us06"
          checked={formData.us06 === "true"}
          disabled={formData.zevType !== "EREV"}
          onChange={(e) => {
            handleChange(e.target.name, e.target.checked ? "true" : "false");
          }}
        />
        <span>(requires certificate upload)</span>
      </div>
      {formData.us06 === "true" && formData.zevType === "EREV" && (
        <Dropzone
          files={files}
          setFiles={setFiles}
          disabled={isPending}
          maxNumberOfFiles={20}
          allowedFileTypes={allowedFileTypes}
        />
      )}

      <div className="flex items-center py-2 my-2">
        <label className="w-72">Electric EPA Range (km)</label>
        <input
          name="range"
          type="text"
          value={formData.range ?? ""}
          className="border p-2 w-full"
          onChange={(e) => {
            handleChange(e.target.name, e.target.value);
          }}
        />
      </div>
      <div className="flex items-center py-2 my-2">
        <label className="w-72">Body Type</label>
        <select
          name="bodyType"
          value={formData.bodyType}
          className="border p-2 w-full"
          onChange={(e) => {
            handleChange(e.target.name, e.target.value);
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
        <label className="w-72">GVWR (kg)</label>
        <input
          name="gvwr"
          type="text"
          value={formData.gvwr ?? ""}
          className="border p-2 w-full"
          onChange={(e) => {
            handleChange(e.target.name, e.target.value);
          }}
        />
      </div>
      <div className="flex space-x-2">{button}</div>
    </div>
  );
}
