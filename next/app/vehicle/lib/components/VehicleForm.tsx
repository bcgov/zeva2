"use client";

import {
  useState,
  useCallback,
  useTransition,
  useMemo,
  useEffect,
} from "react";
import {
  VehicleClassCode,
  VehicleStatus,
  VehicleZevType,
} from "@/prisma/generated/client";
import { getVehiclePayload } from "../utilsClient";
import { SerializedVehicleWithOrg } from "../data";
import { getModelYearEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { createOrUpdateVehicle } from "../actions";
import { useRouter } from "next/navigation";
import { Routes } from "@/app/lib/constants";

export function VehicleForm(props: { vehicle?: SerializedVehicleWithOrg }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");
  const [formData, setFormData] = useState<Partial<Record<string, string>>>({});

  const modelYearsMap = useMemo(() => {
    return getModelYearEnumsToStringsMap();
  }, []);

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
    setFormData((prev) => {
      return { ...prev, [key]: value };
    });
  }, []);

  const handleSubmit = useCallback(
    (status: VehicleStatus) => {
      startTransition(async () => {
        try {
          const vehiclePayload = getVehiclePayload(formData, status);
          if (props.vehicle) {
            vehiclePayload.id = props.vehicle.id;
          }
          const response = await createOrUpdateVehicle(vehiclePayload);
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
    },
    [formData, props.vehicle, router],
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
