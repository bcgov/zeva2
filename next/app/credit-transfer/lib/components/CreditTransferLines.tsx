"use client";

import { useMemo } from "react";
import { Button } from "@/app/lib/components";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import {
  getStringsToModelYearsEnumsMap,
  getStringsToVehicleClassEnumsMap,
  getStringsToZevClassEnumsMap,
} from "@/app/lib/utils/enumMaps";

export type CreditTransferLine = { id: string } & Partial<
  Record<string, string>
>;

export const CreditTransferLines = (props: {
  lines: CreditTransferLine[];
  addLine: () => void;
  removeLine: (id: string) => void;
  handleLineChange: (id: string, key: string, value: string) => void;
  disabled: boolean;
}) => {
  const vehicleClassesMap = useMemo(() => {
    return getStringsToVehicleClassEnumsMap();
  }, []);

  const zevClassesMap = useMemo(() => {
    return getStringsToZevClassEnumsMap();
  }, []);

  const modelYearsMap = useMemo(() => {
    return getStringsToModelYearsEnumsMap();
  }, []);

  if (props.disabled) {
    return <LoadingSkeleton />;
  }
  return (
    <div className="flex flex-col space-y-2">
      {props.lines.map((line) => {
        return (
          <div key={line.id} className="flex flex-row space-x-2">
            <span key="vehicleClass" className="flex flex-col">
              <label htmlFor="vehicleClass">Vehicle Class</label>
              <select
                id="vehicleClass"
                value={line.vehicleClass}
                onChange={(e) =>
                  props.handleLineChange(
                    line.id,
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
                value={line.zevClass}
                onChange={(e) =>
                  props.handleLineChange(line.id, "zevClass", e.target.value)
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
                value={line.modelYear}
                onChange={(e) =>
                  props.handleLineChange(line.id, "modelYear", e.target.value)
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
                value={line.numberOfUnits}
                onChange={(e) =>
                  props.handleLineChange(
                    line.id,
                    "numberOfUnits",
                    e.target.value,
                  )
                }
              />
            </span>
            <span key="dollarValuePerUnit" className="flex flex-col">
              <label htmlFor="dollarValuePerUnit">Dollar Value per Unit</label>
              <input
                type="text"
                id="dollarValuePerUnit"
                value={line.dollarValuePerUnit}
                onChange={(e) =>
                  props.handleLineChange(
                    line.id,
                    "dollarValuePerUnit",
                    e.target.value,
                  )
                }
              />
            </span>
            <span>
              <Button onClick={() => props.removeLine(line.id)}>
                Remove Line
              </Button>
            </span>
          </div>
        );
      })}
      <Button onClick={props.addLine}>Add Line</Button>
    </div>
  );
};
