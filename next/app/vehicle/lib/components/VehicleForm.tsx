"use client";

import { useState, useCallback, useTransition, useMemo } from "react";
import { VehiclePayload } from "../actions";
import { getStringsToModelYearsEnumsMap } from "@/app/lib/utils/enumMaps";
import {
  ModelYear,
  VehicleClassCode,
  VehicleStatus,
  VehicleZevType,
} from "@/prisma/generated/client";
import { getVehiclePayload } from "../utilsClient";
import { SerializedVehicleWithOrg } from "../data";

export type VehicleFormData = {
  modelName: string;
  make: string;
  modelYear: ModelYear | "";
  zevType: VehicleZevType | "";
  us06: boolean;
  bodyType: VehicleClassCode | "";
  range: string;
  gvwr: string;
};

export function VehicleForm(props: {
  vehicle?: SerializedVehicleWithOrg;
  handleSave?: (data: VehiclePayload) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  const initialValues = useMemo(() => {
    return props.vehicle;
  }, [props.vehicle]);

  const [error, setError] = useState<string>("");
  const [formData, setFormData] = useState<VehicleFormData>({
    modelYear: initialValues?.modelYear || "",
    make: initialValues?.make || "",
    modelName: initialValues?.modelName || "",
    zevType: initialValues?.vehicleZevType || "",
    us06: initialValues?.hasPassedUs06Test || false,
    range: initialValues?.range?.toString() || "",
    bodyType: initialValues?.vehicleClassCode || "",
    gvwr: initialValues?.weightKg || "",
  });

  const modelYearMap = getStringsToModelYearsEnumsMap();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, type } = e.target;
    const value =
      type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : e.target.value;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = useCallback(
    (status: VehicleStatus) => {
      startTransition(async () => {
        if (props.handleSave) {
          try {
            const vehiclePayload = getVehiclePayload(formData, status);
            if (initialValues?.id) {
              vehiclePayload.id = initialValues.id;
            }
            await props.handleSave(vehiclePayload);
          } catch (e) {
            if (e instanceof Error) {
              setError(e.message);
            }
          }
        }
      });
    },
    [formData, initialValues, props.handleSave],
  );
  const buttonLabel = useMemo(() => {
    if (isPending) return "...";
    if (initialValues?.id) return "Save";
    return "Save Draft";
  }, [isPending, initialValues]);
  if (
    props.vehicle &&
    !["DRAFT", "CHANGES_REQUESTED"].includes(props.vehicle.status)
  ) {
    return (
      <div className="p-6 font-semibold">This vehicle cannot be modified.</div>
    );
  }

  return (
    <div>
      {error && <p className="text-red-600">{error}</p>}
      <div className="flex items-center py-2 my-2">
        <label htmlFor="make" className="w-72">
          Model Year
        </label>
        <select
          name="modelYear"
          className="border p-2 w-full"
          value={formData.modelYear}
          onChange={handleChange}
        >
          <option value="">--</option>
          {Object.entries(modelYearMap).map(([label, enumValue]) => (
            <option key={enumValue} value={enumValue}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center py-2 my-2">
        <label htmlFor="make" className="w-72">
          Make
        </label>
        <input
          name="make"
          type="text"
          onChange={handleChange}
          value={formData.make}
          className="border p-2 w-full"
        />
      </div>
      <div className="flex items-center py-2 my-2">
        <label htmlFor="make" className="w-72">
          Model Name
        </label>
        <input
          name="modelName"
          type="text"
          value={formData.modelName}
          onChange={handleChange}
          className="border p-2 w-full"
        />
      </div>
      <div className="flex items-center py-2 my-2">
        <label htmlFor="make" className="w-72">
          ZEV Type
        </label>
        <select
          name="zevType"
          value={formData.zevType}
          className="border p-2 w-full"
          onChange={handleChange}
        >
          <option value="">--</option>
          {Object.entries(VehicleZevType).map(([enumKey, label]) => (
            <option key={enumKey} value={enumKey}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center space-x-4">
        <span>Claim Additional US06 0.2 credit</span>
        <input
          type="checkbox"
          name="us06"
          checked={formData.us06}
          disabled={formData.zevType !== "EREV"}
          onChange={handleChange}
        />
        <span>(requires certificate upload)</span>
      </div>

      <div className="flex items-center py-2 my-2">
        <label htmlFor="make" className="w-72">
          Electric EPA Range (km)
        </label>
        <input
          name="range"
          type="text"
          value={formData.range}
          className="border p-2 w-full"
          onChange={handleChange}
        />
      </div>
      <div className="flex items-center py-2 my-2">
        <label htmlFor="make" className="w-72">
          Body Type
        </label>
        <select
          name="bodyType"
          value={formData.bodyType}
          className="border p-2 w-full"
          onChange={handleChange}
        >
          <option value="">--</option>
          {Object.entries(VehicleClassCode).map(([enumKey, label]) => (
            <option key={enumKey} value={enumKey}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center py-2 my-2">
        <label htmlFor="make" className="w-72">
          GVWR (kg)
        </label>
        <input
          name="gvwr"
          type="text"
          value={formData.gvwr}
          className="border p-2 w-full"
          onChange={handleChange}
        />
      </div>
      <div className="flex space-x-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => handleSubmit(VehicleStatus.DRAFT)}
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}
