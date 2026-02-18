"use client";

import { Dispatch, SetStateAction, useCallback, useMemo } from "react";
import { Button } from "@/app/lib/components";
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
              <td className="border border-gray-300">
                <select
                  id="type"
                  value={adjustment.type}
                  onChange={(e) => {
                    handleAdjustmentChange(index, "type", e.target.value);
                  }}
                  disabled={props.disabled}
                >
                  {Object.keys(balanceTypesMaps.stringsToEnums).map(
                    (balanceType) => (
                      <option key={balanceType} value={balanceType}>
                        {balanceType}
                      </option>
                    ),
                  )}
                </select>
              </td>
              <td className="border border-gray-300">
                <select
                  id="vehicleClass"
                  value={adjustment.vehicleClass}
                  onChange={(e) =>
                    handleAdjustmentChange(
                      index,
                      "vehicleClass",
                      e.target.value,
                    )
                  }
                  disabled={props.disabled}
                >
                  {Object.keys(vehicleClassesMaps.stringsToEnums).map((vc) => (
                    <option key={vc} value={vc}>
                      {vc}
                    </option>
                  ))}
                </select>
              </td>
              <td className="border border-gray-300">
                <select
                  id="zevClass"
                  value={adjustment.zevClass}
                  onChange={(e) =>
                    handleAdjustmentChange(index, "zevClass", e.target.value)
                  }
                  disabled={props.disabled}
                >
                  {Object.keys(zevClassesMaps.stringsToEnums).map((zc) => (
                    <option key={zc} value={zc}>
                      {zc}
                    </option>
                  ))}
                </select>
              </td>
              <td className="border border-gray-300">
                <select
                  id="modelYear"
                  value={adjustment.modelYear}
                  onChange={(e) =>
                    handleAdjustmentChange(index, "modelYear", e.target.value)
                  }
                  disabled={props.disabled}
                >
                  {Object.entries(modelYearsMaps.stringsToEnums).map(
                    ([key, value]) => {
                      if (
                        value &&
                        value >= ModelYear.MY_2019 &&
                        value <= ModelYear.MY_2035
                      ) {
                        return (
                          <option key={key} value={key}>
                            {key}
                          </option>
                        );
                      }
                    },
                  )}
                </select>
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
