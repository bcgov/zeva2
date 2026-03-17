"use client";

import { Dispatch, SetStateAction, useCallback, useMemo } from "react";
import { Button } from "@/app/lib/components";
import { Dropdown } from "@/app/lib/components/inputs";
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

export type AgreementContentRecord = {
  vehicleClass?: VehicleClass;
  zevClass?: ZevClass;
  modelYear?: ModelYear;
  numberOfUnits: string;
};

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
          vehicleClass: undefined,
          zevClass: undefined,
          modelYear: undefined,
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
          className="p-4 border-b border-gray-300 space-y-3"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium text-primaryText">Vehicle Class</label>
              <Dropdown
                options={Object.entries(vehicleClassesMaps).map(([key, value]) => ({
                  value: value as string,
                  label: key,
                }))}
                value={record.vehicleClass}
                onChange={(value) =>
                  handleRecordChange(index, "vehicleClass", value)
                }
                disabled={props.disabled}
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium text-primaryText">ZEV Class</label>
              <Dropdown
                options={Object.entries(zevClassesMaps).map(([key, value]) => ({
                  value: value as string,
                  label: key,
                }))}
                value={record.zevClass}
                onChange={(value) =>
                  handleRecordChange(index, "zevClass", value)
                }
                disabled={props.disabled}
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium text-primaryText">Model Year</label>
              <Dropdown
                options={Object.entries(modelYearsMaps)
                  .filter(
                    ([_key, value]) =>
                      value &&
                      value >= ModelYear.MY_2019 &&
                      value <= ModelYear.MY_2035
                  )
                  .map(([key, value]) => ({
                    value: value as string,
                    label: key,
                  }))}
                value={record.modelYear}
                onChange={(value) =>
                  handleRecordChange(index, "modelYear", value)
                }
                disabled={props.disabled}
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium text-primaryText">Number of Units</label>
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
          </div>
          <div>
            <Button variant="danger" size="small" onClick={() => removeRecord(index)} disabled={props.disabled}>
              Remove
            </Button>
          </div>
        </div>
      ))}
      <Button onClick={addRecord} disabled={props.disabled}>
        + Add Additional Line
      </Button>
    </div>
  );
};
