"use client";

import { getVehicleClassEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { VehicleClass } from "@/prisma/generated/client";
import { NvValues } from "../actions";
import { useMemo } from "react";

export const MyrNvValues = (props: {
  nvValues: NvValues;
  handleChange: (key: VehicleClass, value: string) => void;
  disabled: boolean;
}) => {
  const vehicleClassMap = useMemo(() => {
    return getVehicleClassEnumsToStringsMap();
  }, []);

  return Object.values(VehicleClass).map((vehicleClass) => (
    <div key={vehicleClass} className="flex items-center py-2 my-2">
      <label className="w-72" htmlFor={`${vehicleClass}-vehicle-class`}>
        {`Section 11 NV value for the ${vehicleClassMap[vehicleClass]} vehicle class`}
      </label>
      <input
        name={`${vehicleClass}-vehicle-class`}
        type="text"
        value={props.nvValues[vehicleClass] ?? ""}
        onChange={(e) => props.handleChange(vehicleClass, e.target.value)}
        className="border p-2 w-full"
        disabled={props.disabled}
      />
    </div>
  ));
};
