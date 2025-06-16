"use client";

import { useState, useEffect } from "react";
import { useActionState } from "react";
import { createOrUpdateVehicle } from "../actions";
import {
  getZevTypeEnumsToStringsMap,
  getModelYearEnumsToStringsMap,
  getVehicleClassCodeEnumsToStringsMap,
} from "@/app/lib/utils/enumMaps";

const initialState = { error: "", success: false };

type VehicleFormData = {
  modelName: string;
  make: string;
  modelYear: string;
  zevType: string;
  us06: boolean;
  bodyType: string;
  range: string;
  gvwr: string;
};

export default function VehicleForm({
  initialValues = {},
}: {
  initialValues?: Partial<VehicleFormData> & {
    id?: number;
    organizationId?: number;
  };
}) {
  const [formData, setFormData] = useState<VehicleFormData>({
    modelYear: initialValues.modelYear || "",
    make: initialValues.make || "",
    modelName: initialValues.modelName || "",
    zevType: initialValues.zevType || "",
    us06: initialValues.us06 || false,
    range: initialValues.range?.toString() || "",
    bodyType: initialValues.bodyType || "",
    gvwr: initialValues.gvwr?.toString() || "",
  });

  const [state, formAction] = useActionState(
    async (_: any, formDataObj: FormData) => {
      if (initialValues.id) {
        formDataObj.set("vehicleId", initialValues.id.toString());
      }
      if (initialValues.organizationId) {
        formDataObj.set(
          "organizationId",
          initialValues.organizationId.toString(),
        );
      }
      return await createOrUpdateVehicle(formDataObj);
    },
    initialState,
  );
  useEffect(() => {
    if (state.success) {
      setFormData({
        modelYear: "",
        make: "",
        modelName: "",
        zevType: "",
        us06: false,
        range: "",
        bodyType: "",
        gvwr: "",
      });
    }
  }, [state.success]);
  const modelYearMap = getModelYearEnumsToStringsMap();
  const zevClassMap = getZevTypeEnumsToStringsMap();
  const vehicleClassCodeMap = getVehicleClassCodeEnumsToStringsMap();

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

  const setStatusAndSubmit = (status: string) => {
    const statusInput = document.getElementById("status") as HTMLInputElement;
    if (statusInput) {
      statusInput.value = status;
      statusInput.form?.requestSubmit();
    }
  };

  return (
    <form action={formAction} className="space-y-4" onChange={handleChange}>
      {state.error && <p className="text-red-600">{state.error}</p>}
      {state.success && <p className="text-green-600">Saved successfully!</p>}

      {initialValues.id && (
        <input
          type="hidden"
          name="vehicleId"
          value={initialValues.id.toString()}
        />
      )}
      {initialValues.organizationId && (
        <input
          type="hidden"
          name="organizationId"
          value={initialValues.organizationId.toString()}
        />
      )}

      <input type="hidden" name="status" id="status" />

      <select
        name="modelYear"
        className="border p-2 w-full"
        value={formData.modelYear}
        onChange={handleChange}
      >
        <option value="">Model Year</option>
        {Object.entries(modelYearMap).map(([enumValue, label]) => (
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
        {Object.entries(zevClassMap).map(([enumKey, label]) => (
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
        {Object.entries(vehicleClassCodeMap).map(([enumKey, label]) => (
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
        <button type="button" onClick={() => setStatusAndSubmit("draft")}>
          Save draft
        </button>

        <button type="button" onClick={() => setStatusAndSubmit("submitted")}>
          Submit
        </button>
      </div>
    </form>
  );
}
