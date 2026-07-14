"use client";

import { StatusBanner, TextInput } from "@/app/lib/components";
import {
  getModelYearEnumsToStringsMap,
  getVehicleClassEnumsToStringsMap,
} from "@/app/lib/utils/enumMaps";
import { ModelYear, VehicleClass } from "@/prisma/generated/enums";
import { useMemo } from "react";
import { nvMap, ZevAndIceCounts } from "../constants";

export const NvValuesSubmission = (props: {
  modelYear: ModelYear;
  zevAndIceCounts: ZevAndIceCounts;
  handleZevAndIceCountsChange: (
    vc: VehicleClass,
    type: "zev" | "ice",
    value: string,
  ) => void;
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
      return {
        keyword: "Consumer Sales",
        zev: "ZEV Consumer Sales",
        ice: "ICE consumer Sales",
      };
    }
    return {
      keyword: "Supplied",
      zev: "ZEVs Supplied",
      ice: "ICE Vehicles Supplied",
    };
  }, [props.modelYear]);

  const modelYearsMap = useMemo(() => {
    return getModelYearEnumsToStringsMap();
  }, []);

  return (
    <div className="flex flex-col border border-dividerMedium rounded">
      <div className="flex flex-col p-5 bg-disabledBG gap-2">
        <span className="font-bold text-xl">
          {modelYearsMap[props.modelYear]} Model Year {salesOrSupplied.keyword}
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
            <div key={index} className="flex flex-row gap-5">
              <div className="flex-1">
                <TextInput
                  label={`Enter total number of ${salesOrSupplied.zev} of the ${vehicleClassesMap[vc]} vehicle class`}
                  placeholder="Enter number"
                  value={props.zevAndIceCounts[vc]?.["zev"]}
                  onChange={(value: string) =>
                    props.handleZevAndIceCountsChange(vc, "zev", value)
                  }
                  disabled={props.disabled}
                />
              </div>
              <div className="flex-1">
                <TextInput
                  label={`Enter total number of ${salesOrSupplied.ice} of the ${vehicleClassesMap[vc]} vehicle class`}
                  placeholder="Enter number"
                  value={props.zevAndIceCounts[vc]?.["ice"]}
                  onChange={(value: string) =>
                    props.handleZevAndIceCountsChange(vc, "ice", value)
                  }
                  disabled={props.disabled}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
