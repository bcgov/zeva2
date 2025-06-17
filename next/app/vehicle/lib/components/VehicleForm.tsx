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
        //only handle creating new vehicle for now:
        if (!initialValues && props.handleSave) {
          try {
            const vehiclePayload = getVehiclePayload(formData, status);
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

  return (
    <div>
      {error && <p className="text-red-600">{error}</p>}
      <select
        name="modelYear"
        className="border p-2 w-full"
        value={formData.modelYear}
        onChange={handleChange}
      >
        <option value="">Model Year</option>
        {Object.entries(modelYearMap).map(([label, enumValue]) => (
          <option key={enumValue} value={enumValue}>
            {label}
          </option>
        ))}
      </select>

      <input
        name="make"
        type="text"
        onChange={handleChange}
        placeholder="Make"
        value={formData.make}
        className="border p-2 w-full"
      />

      <input
        name="modelName"
        type="text"
        placeholder="Model"
        value={formData.modelName}
        onChange={handleChange}
        className="border p-2 w-full"
      />

      <select
        name="zevType"
        value={formData.zevType}
        className="border p-2 w-full"
        onChange={handleChange}
      >
        <option value="">Select ZEV Type</option>
        {Object.entries(VehicleZevType).map(([enumKey, label]) => (
          <option key={enumKey} value={enumKey}>
            {label}
          </option>
        ))}
      </select>

      <div className="flex items-center space-x-2">
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

      <input
        name="range"
        type="text"
        placeholder="Electric EPA Range (km)"
        value={formData.range}
        className="border p-2 w-full"
        onChange={handleChange}
      />

      <select
        name="bodyType"
        value={formData.bodyType}
        className="border p-2 w-full"
        onChange={handleChange}
      >
        <option value="">Select Body Type</option>
        {Object.entries(VehicleClassCode).map(([enumKey, label]) => (
          <option key={enumKey} value={enumKey}>
            {label}
          </option>
        ))}
      </select>

      <input
        name="gvwr"
        type="text"
        placeholder="GVWR (kg)"
        value={formData.gvwr}
        className="border p-2 w-full"
        onChange={handleChange}
      />

      <div className="flex space-x-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => handleSubmit(VehicleStatus.DRAFT)}
        >
          {isPending ? "..." : "Save Draft"}
        </button>
      </div>
    </div>
  );
}
