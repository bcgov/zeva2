"use client";

import { useMemo } from "react";
import { getHelpingMaps } from "../utilsClient";
import {
  ModelYear,
  TransactionType,
  VehicleClass,
  ZevClass,
} from "@/prisma/generated/client";
import { Button } from "@/app/lib/components";

export type Adjustment = { id: string } & Partial<Record<string, string>>;

export const Adjustments = (props: {
  adjustments: Adjustment[];
  addAdjustment: () => void;
  removeAdjustment: (id: string) => void;
  handleAdjustmentChange: (id: string, key: string, value: string) => void;
}) => {
  const helpingMaps = useMemo(() => {
    return getHelpingMaps();
  }, []);

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
                <option value={TransactionType.CREDIT}>
                  {helpingMaps.transactionTypesMap[TransactionType.CREDIT]}
                </option>
                <option value={TransactionType.DEBIT}>
                  {helpingMaps.transactionTypesMap[TransactionType.DEBIT]}
                </option>
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
                {Object.values(VehicleClass).map((vehicleClass) => (
                  <option key={vehicleClass} value={vehicleClass}>
                    {helpingMaps.vehicleClassesMap[vehicleClass]}
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
                {Object.values(ZevClass).map((zevClass) => (
                  <option key={zevClass} value={zevClass}>
                    {helpingMaps.zevClassesMap[zevClass]}
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
                {Object.values(ModelYear).map((modelYear) => (
                  <option key={modelYear} value={modelYear}>
                    {helpingMaps.modelYearsMap[modelYear]}
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
              <Button onClick={() => props.removeAdjustment(adjustment.id)}>
                Remove Adjustment
              </Button>
            </span>
          </div>
        );
      })}
      <Button onClick={props.addAdjustment}>Add Adjustment</Button>
    </div>
  );
};
