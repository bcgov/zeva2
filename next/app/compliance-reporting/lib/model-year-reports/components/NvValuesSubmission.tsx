"use client";

import { TextInput } from "@/app/lib/components";
import {
  getModelYearEnumsToStringsMap,
  getVehicleClassEnumsToStringsMap,
} from "@/app/lib/utils/enumMaps";
import { ModelYear, VehicleClass } from "@/prisma/generated/enums";
import { useMemo } from "react";
import { NvValues } from "../actions";
import { nvMap } from "../constants";

export const NvValuesSubmission = (props: {
  modelYear: ModelYear;
  nvValues: NvValues;
  handleNvValuesChange: (vc: VehicleClass, value: string) => void;
  disabled: boolean;
}) => {
  const vehicleClasses = useMemo(() => {
    const classes = nvMap[props.modelYear];
    if (classes) {
      return classes;
    }
    return [];
  }, [props.modelYear]);

  const vehicleClassesMap = useMemo(() => {
    return getVehicleClassEnumsToStringsMap();
  }, []);

  const salesOrSupplied = useMemo(() => {
    if (props.modelYear < ModelYear.MY_2024) {
      return "Consumer Sales";
    }
    return "Vehicles Supplied";
  }, [props.modelYear]);

  const modelYearsMap = useMemo(() => {
    return getModelYearEnumsToStringsMap();
  }, []);

  return (
    <div className="flex flex-col gap-2 border border-dividerMedium/40">
      <div className="flex flex-col gap-1 p-2 bg-gray-100">
        <span className="font-bold font-lg">
          {modelYearsMap[props.modelYear]} Model Year {salesOrSupplied}
        </span>
        <span>
          The submitted number should not include any vehicle with a gross
          vehicle weight rating of more than 3856 kg if that vehicle was
          supplied before October 1, 2024.
        </span>
      </div>
      {vehicleClasses.map((vc, index) => {
        return (
          <div key={index} className="p-2">
            <TextInput
              label={`Enter number of ${salesOrSupplied} of the ${vehicleClassesMap[vc]} vehicle class`}
              placeholder="Enter number"
              value={props.nvValues[vc]}
              onChange={(value: string) =>
                props.handleNvValuesChange(vc, value)
              }
              disabled={props.disabled}
            />
          </div>
        );
      })}
    </div>
  );
};
