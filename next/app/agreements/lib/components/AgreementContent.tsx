"use client";

import { Dispatch, SetStateAction, useCallback, useMemo } from "react";
import { Button } from "@/app/lib/components";
import {
  getStringsToModelYearsEnumsMap,
  getStringsToVehicleClassEnumsMap,
  getStringsToZevClassEnumsMap,
} from "@/app/lib/utils/enumMaps";
import { ModelYear, VehicleClass, ZevClass } from "@/prisma/generated/enums";
import { ZevUnitRecord } from "@/lib/utils/zevUnit";
import {
  isModelYear,
  isVehicleClass,
  isZevClass,
} from "@/app/lib/utils/typeGuards";

export type AgreementContentRecord = Omit<
  ZevUnitRecord,
  "type" | "numberOfUnits"
> & { numberOfUnits: string };

const fieldLabelClass = "py-1 font-semibold text-primaryBlue";
const fieldContentClass = "p-1 border border-gray-300 rounded";

export const AgreementContent = (props: {
  content: AgreementContentRecord[];
  setContent: Dispatch<SetStateAction<AgreementContentRecord[]>>;
  disabled: boolean;
}) => {
  const vehicleClassesMaps = useMemo(() => {
    return getStringsToVehicleClassEnumsMap();
  }, []);

  const zevClassesMaps = useMemo(() => {
    return getStringsToZevClassEnumsMap();
  }, []);

  const modelYearsMaps = useMemo(() => {
    return getStringsToModelYearsEnumsMap();
  }, []);

  const addRecord = useCallback(() => {
    props.setContent((prev) => {
      return [
        ...prev,
        {
          vehicleClass: VehicleClass.REPORTABLE,
          zevClass: ZevClass.A,
          modelYear: ModelYear.MY_2019,
          numberOfUnits: "0",
        },
      ];
    });
  }, []);

  const removeRecord = useCallback((index: number) => {
    props.setContent((prev) => {
      return prev.filter((_record, recordIndex) => recordIndex !== index);
    });
  }, []);

  const handleRecordChange = useCallback(
    (index: number, key: keyof AgreementContentRecord, value: string) => {
      if (
        key === "numberOfUnits" ||
        (key === "vehicleClass" && isVehicleClass(value)) ||
        (key === "zevClass" && isZevClass(value)) ||
        (key === "modelYear" && isModelYear(value))
      ) {
        props.setContent((prev) => {
          return prev.map((record, recordIndex) => {
            if (recordIndex === index) {
              return { ...record, [key]: value };
            }
            return record;
          });
        });
      }
    },
    [],
  );

  return (
    <div className="p-2 border border-gray-300 rounded">
      <p className={fieldLabelClass}>ZEV Units</p>
      {props.content.map((record, index) => (
        <div
          key={index}
          className="p-2 border-b border-gray-300 grid grid-cols-[140px_220px_250px_80px]"
        >
          <div className="grid grid-cols-[50px_50px]">
            <span className="py-1">Vehicle Class</span>
            <select
              className={fieldContentClass}
              value={record.vehicleClass}
              onChange={(e) =>
                handleRecordChange(index, "vehicleClass", e.target.value)
              }
              disabled={props.disabled}
            >
              {Object.entries(vehicleClassesMaps).map(([key, value]) => (
                <option key={key} value={value}>
                  {key}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-[50px_50px]">
            <span className="py-1">ZEV Class</span>
            <select
              className={fieldContentClass}
              value={record.zevClass}
              onChange={(e) =>
                handleRecordChange(index, "zevClass", e.target.value)
              }
              disabled={props.disabled}
            >
              {Object.entries(zevClassesMaps).map(([key, value]) => (
                <option key={key} value={value}>
                  {key}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-[100px_80px]">
            <span className="py-1">Model Year</span>
            <select
              value={record.modelYear}
              onChange={(e) =>
                handleRecordChange(index, "modelYear", e.target.value)
              }
              disabled={props.disabled}
            >
              {Object.entries(modelYearsMaps).map(([key, value]) => {
                if (
                  value &&
                  value >= ModelYear.MY_2019 &&
                  value <= ModelYear.MY_2035
                ) {
                  return (
                    <option key={key} value={value}>
                      {key}
                    </option>
                  );
                }
              })}
            </select>
          </div>
          <div className="grid grid-cols-[150px_80px]">
            <span className="py-1">Number of Units</span>
            <input
              className={fieldContentClass + " text-right"}
              type="text"
              value={record.numberOfUnits}
              onChange={(e) =>
                handleRecordChange(index, "numberOfUnits", e.target.value)
              }
              disabled={props.disabled}
            />
          </div>
          <Button onClick={() => removeRecord(index)} disabled={props.disabled}>
            Remove
          </Button>
        </div>
      ))}
      <Button onClick={addRecord} disabled={props.disabled}>
        + Add Additional Line
      </Button>
    </div>
  );
};
