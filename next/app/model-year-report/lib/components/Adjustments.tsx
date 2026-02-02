"use client";

import { useMemo } from "react";
import { Button } from "@/app/lib/components";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import {
  getStringsToBalanceTypeEnumsMap,
  getStringsToModelYearsEnumsMap,
  getStringsToVehicleClassEnumsMap,
  getStringsToZevClassEnumsMap,
} from "@/app/lib/utils/enumMaps";
import { ModelYear } from "@/prisma/generated/client";

export type Adjustment = { id: string } & Partial<Record<string, string>>;

export const Adjustments = (props: {
  adjustments: Adjustment[];
  addAdjustment: () => void;
  removeAdjustment: (id: string) => void;
  handleAdjustmentChange: (id: string, key: string, value: string) => void;
  disabled: boolean;
}) => {
  const balanceTypesMap = useMemo(() => {
    return getStringsToBalanceTypeEnumsMap();
  }, []);

  const vehicleClassesMap = useMemo(() => {
    return getStringsToVehicleClassEnumsMap();
  }, []);

  const zevClassesMap = useMemo(() => {
    return getStringsToZevClassEnumsMap();
  }, []);

  const modelYearsMap: Partial<Record<string, ModelYear>> = useMemo(() => {
    const map = getStringsToModelYearsEnumsMap();
    const entries = Object.entries(map).filter(([_key, value]) => {
      if (value && value >= ModelYear.MY_2019 && value <= ModelYear.MY_2035) {
        return true;
      }
      return false;
    });
    return Object.fromEntries(entries);
  }, []);

  if (props.disabled) {
    return <LoadingSkeleton />;
  }
  return (
    <div>
      {props.adjustments.map((adjustment) => {
        return (
          <div key={adjustment.id} className="flex flex-row">
            <span key="type" className="flex flex-col">
              <label htmlFor="type">Type</label>
              <select
                id="type"
                value={adjustment.type}
                onChange={(e) => {
                  props.handleAdjustmentChange(
                    adjustment.id,
                    "type",
                    e.target.value,
                  );
                }}
              >
                {Object.entries(balanceTypesMap).map(([key, value]) => (
                  <option key={value} value={value}>
                    {key}
                  </option>
                ))}
              </select>
            </span>
            <span key="vehicleClass" className="flex flex-col">
              <label htmlFor="vehicleClass">Vehicle Class</label>
              <select
                id="vehicleClass"
                value={adjustment.vehicleClass}
                onChange={(e) =>
                  props.handleAdjustmentChange(
                    adjustment.id,
                    "vehicleClass",
                    e.target.value,
                  )
                }
              >
                {Object.entries(vehicleClassesMap).map(([key, value]) => (
                  <option key={value} value={value}>
                    {key}
                  </option>
                ))}
              </select>
            </span>
            <span key="zevClass" className="flex flex-col">
              <label htmlFor="zevClass">ZEV Class</label>
              <select
                id="zevClass"
                value={adjustment.zevClass}
                onChange={(e) =>
                  props.handleAdjustmentChange(
                    adjustment.id,
                    "zevClass",
                    e.target.value,
                  )
                }
              >
                {Object.entries(zevClassesMap).map(([key, value]) => (
                  <option key={value} value={value}>
                    {key}
                  </option>
                ))}
              </select>
            </span>
            <span key="modelYear" className="flex flex-col">
              <label htmlFor="modelYear">Model Year</label>
              <select
                id="modelYear"
                value={adjustment.modelYear}
                onChange={(e) =>
                  props.handleAdjustmentChange(
                    adjustment.id,
                    "modelYear",
                    e.target.value,
                  )
                }
              >
                {Object.entries(modelYearsMap).map(([key, value]) => (
                  <option key={value} value={value}>
                    {key}
                  </option>
                ))}
              </select>
            </span>
            <span key="numberOfUnits" className="flex flex-col">
              <label htmlFor="numberOfUnits">Number of Units</label>
              <input
                type="text"
                id="numberOfUnits"
                value={adjustment.numberOfUnits}
                onChange={(e) =>
                  props.handleAdjustmentChange(
                    adjustment.id,
                    "numberOfUnits",
                    e.target.value,
                  )
                }
              />
            </span>
            <span>
              <Button
                variant="danger"
                size="small"
                onClick={() => props.removeAdjustment(adjustment.id)}
              >
                Remove Adjustment
              </Button>
            </span>
          </div>
        );
      })}
      <Button variant="secondary" onClick={props.addAdjustment}>
        Add Adjustment
      </Button>
    </div>
  );
};
