"use client";

import { useMemo } from "react";
import { Button } from "@/app/lib/components";
import { Dropdown } from "@/app/lib/components/inputs";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import {
  getStringsToModelYearsEnumsMap,
  getStringsToVehicleClassEnumsMap,
  getStringsToZevClassEnumsMap,
} from "@/app/lib/utils/enumMaps";
import { ModelYear } from "@/prisma/generated/enums";

export type CreditTransferLine = {
  vehicleClass: string;
  zevClass: string;
  modelYear: string;
  numberOfUnits: string;
  dollarValuePerUnit: string;
};

export const CreditTransferLines = (props: {
  lines: CreditTransferLine[];
  addLine: () => void;
  removeLine: (index: number) => void;
  handleLineChange: (
    index: number,
    key: keyof CreditTransferLine,
    value: string,
  ) => void;
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
      {props.lines.map((line, index) => {
        return (
          <div key={index} className="flex flex-row space-x-2">
            <span key="vehicleClass" className="flex flex-col">
              <Dropdown
                id="vehicleClass"
                label="Vehicle Class"
                options={Object.entries(vehicleClassesMap).map(([key, value]) => ({
                  value: value as string,
                  label: key,
                }))}
                value={line.vehicleClass}
                onChange={(value) =>
                  props.handleLineChange(index, "vehicleClass", value)
                }
              />
            </span>
            <span key="zevClass" className="flex flex-col">
              <Dropdown
                id="zevClass"
                label="ZEV Class"
                options={Object.entries(zevClassesMap).map(([key, value]) => ({
                  value: value as string,
                  label: key,
                }))}
                value={line.zevClass}
                onChange={(value) =>
                  props.handleLineChange(index, "zevClass", value)
                }
              />
            </span>
            <span key="modelYear" className="flex flex-col">
              <Dropdown
                id="modelYear"
                label="Model Year"
                options={Object.entries(modelYearsMap)
                  .filter(
                    ([_key, value]) =>
                      value &&
                      value >= ModelYear.MY_2019 &&
                      value <= ModelYear.MY_2035,
                  )
                  .map(([key, value]) => ({
                    value: value as string,
                    label: key,
                  }))}
                value={line.modelYear}
                onChange={(value) =>
                  props.handleLineChange(index, "modelYear", value)
                }
              />
            </span>
            <span key="numberOfUnits" className="flex flex-col">
              <label htmlFor="numberOfUnits">Number of Units</label>
              <input
                type="text"
                id="numberOfUnits"
                value={line.numberOfUnits}
                onChange={(e) =>
                  props.handleLineChange(index, "numberOfUnits", e.target.value)
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
                    index,
                    "dollarValuePerUnit",
                    e.target.value,
                  )
                }
              />
            </span>
            <span>
              <Button
                variant="danger"
                size="small"
                onClick={() => props.removeLine(index)}
              >
                Remove Line
              </Button>
            </span>
          </div>
        );
      })}
      <Button variant="secondary" onClick={props.addLine}>
        Add Line
      </Button>
    </div>
  );
};
