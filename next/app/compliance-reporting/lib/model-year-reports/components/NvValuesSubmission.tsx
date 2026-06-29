"use client";

import { StatusBanner, TextInput } from "@/app/lib/components";
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
    <div className="flex flex-col border border-dividerMedium rounded">
      <div className="flex flex-col p-5 bg-disabledBG gap-2">
        <span className="font-bold text-xl">
          {modelYearsMap[props.modelYear]} Model Year {salesOrSupplied}
        </span>
        {vehicleClasses.includes(VehicleClass.REPORTABLE) && (
          <StatusBanner
            variant="info"
            title="Important:"
            primaryText="With respect to the Reportable Vehicle Class, do not include any vehicle with a gross vehicle weight over 3,865 kg if they were supplied before Oct 1, 2024."
          />
        )}
      </div>
      <div className="p-5 flex flex-col gap-5">
        {vehicleClasses.map((vc, index) => {
          return (
            <div key={index} className="w-1/2">
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
    </div>
  );
};
