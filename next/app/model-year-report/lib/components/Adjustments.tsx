"use client";

import { Dispatch, SetStateAction, useCallback, useMemo } from "react";
import { Button } from "@/app/lib/components";
import { Dropdown } from "@/app/lib/components/inputs";
import {
  getBalanceTypeEnumsToStringsMap,
  getModelYearEnumsToStringsMap,
  getStringsToBalanceTypeEnumsMap,
  getStringsToModelYearsEnumsMap,
  getStringsToVehicleClassEnumsMap,
  getStringsToZevClassEnumsMap,
  getVehicleClassEnumsToStringsMap,
  getZevClassEnumsToStringsMap,
} from "@/app/lib/utils/enumMaps";
import {
  ModelYear,
  TransactionType,
  VehicleClass,
  ZevClass,
} from "@/prisma/generated/enums";
import { ZevUnitRecord } from "@/lib/utils/zevUnit";

export type Adjustment = Record<keyof ZevUnitRecord, string>;

export const Adjustments = (props: {
  type: "myr" | "assessment";
  adjustments: Adjustment[];
  setAdjustments: Dispatch<SetStateAction<Adjustment[]>>;
  disabled: boolean;
}) => {
  const balanceTypesMaps = useMemo(() => {
    return {
      enumsToStrings: getBalanceTypeEnumsToStringsMap(),
      stringsToEnums: getStringsToBalanceTypeEnumsMap(),
    };
  }, []);

  const vehicleClassesMaps = useMemo(() => {
    return {
      enumsToStrings: getVehicleClassEnumsToStringsMap(),
      stringsToEnums: getStringsToVehicleClassEnumsMap(),
    };
  }, []);

  const zevClassesMaps = useMemo(() => {
    return {
      enumsToStrings: getZevClassEnumsToStringsMap(),
      stringsToEnums: getStringsToZevClassEnumsMap(),
    };
  }, []);

  const modelYearsMaps = useMemo(() => {
    return {
      enumsToStrings: getModelYearEnumsToStringsMap(),
      stringsToEnums: getStringsToModelYearsEnumsMap(),
    };
  }, []);

  const addAdjustment = useCallback(() => {
    const type = balanceTypesMaps.enumsToStrings[TransactionType.CREDIT];
    const vehicleClass =
      vehicleClassesMaps.enumsToStrings[VehicleClass.REPORTABLE];
    const zevClass = zevClassesMaps.enumsToStrings[ZevClass.A];
    const modelYear = modelYearsMaps.enumsToStrings[ModelYear.MY_2019];
    if (type && vehicleClass && zevClass && modelYear) {
      props.setAdjustments((prev) => {
        return [
          ...prev,
          {
            type,
            vehicleClass,
            zevClass,
            modelYear,
            numberOfUnits: "0",
          },
        ];
      });
    }
  }, [balanceTypesMaps, vehicleClassesMaps, zevClassesMaps, modelYearsMaps]);

  const removeAdjustment = useCallback((index: number) => {
    props.setAdjustments((prev) => {
      return prev.filter((_adjustment, adjIndex) => adjIndex !== index);
    });
  }, []);

  const handleAdjustmentChange = useCallback(
    (index: number, key: string, value: string) => {
      props.setAdjustments((prev) => {
        return prev.map((adjustment, adjIndex) => {
          if (adjIndex === index) {
            return { ...adjustment, [key]: value };
          }
          return adjustment;
        });
      });
    },
    [],
  );

  return (
    <>
      <table>
        <thead>
          <tr>
            <th className="border border-gray-300">Type</th>
            <th className="border border-gray-300">Vehicle Class</th>
            <th className="border border-gray-300">ZEV Class</th>
            <th className="border border-gray-300">Model Year</th>
            <th className="border border-gray-300">Number of Units</th>
          </tr>
        </thead>
        <tbody>
          {props.adjustments.map((adjustment, index) => (
            <tr key={index}>
              <td className="border border-gray-300 p-2">
                <Dropdown
                  options={Object.keys(balanceTypesMaps.stringsToEnums).map(
                    (balanceType) => ({
                      value: balanceType,
                      label: balanceType,
                    }),
                  )}
                  value={adjustment.type}
                  onChange={(value) => {
                    handleAdjustmentChange(index, "type", value);
                  }}
                  disabled={props.disabled}
                />
              </td>
              <td className="border border-gray-300 p-2">
                <Dropdown
                  options={Object.keys(vehicleClassesMaps.stringsToEnums).map(
                    (vc) => ({
                      value: vc,
                      label: vc,
                    }),
                  )}
                  value={adjustment.vehicleClass}
                  onChange={(value) =>
                    handleAdjustmentChange(index, "vehicleClass", value)
                  }
                  disabled={props.disabled}
                />
              </td>
              <td className="border border-gray-300 p-2">
                <Dropdown
                  options={Object.keys(zevClassesMaps.stringsToEnums).map(
                    (zc) => ({
                      value: zc,
                      label: zc,
                    }),
                  )}
                  value={adjustment.zevClass}
                  onChange={(value) =>
                    handleAdjustmentChange(index, "zevClass", value)
                  }
                  disabled={props.disabled}
                />
              </td>
              <td className="border border-gray-300 p-2">
                <Dropdown
                  options={Object.entries(modelYearsMaps.stringsToEnums)
                    .filter(
                      ([_key, value]) =>
                        value &&
                        value >= ModelYear.MY_2019 &&
                        value <= ModelYear.MY_2035,
                    )
                    .map(([key]) => ({
                      value: key,
                      label: key,
                    }))}
                  value={adjustment.modelYear}
                  onChange={(value) =>
                    handleAdjustmentChange(index, "modelYear", value)
                  }
                  disabled={props.disabled}
                />
              </td>
              <td className="border border-gray-300">
                <input
                  type="text"
                  id="numberOfUnits"
                  value={adjustment.numberOfUnits}
                  onChange={(e) =>
                    handleAdjustmentChange(
                      index,
                      "numberOfUnits",
                      e.target.value,
                    )
                  }
                  disabled={props.disabled}
                />
              </td>
              <td>
                <Button
                  variant="danger"
                  onClick={() => removeAdjustment(index)}
                  disabled={props.disabled}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Button
        variant="secondary"
        onClick={addAdjustment}
        disabled={props.disabled}
      >
        {props.type === "myr" ? "Add Suggested Adjustment" : "Add Adjustment"}
      </Button>
    </>
  );
};
