"use client";

import { useMemo } from "react";
import { Dropdown } from "@/app/lib/components/inputs";
import {
  getStringsToModelYearsEnumsMap,
  getStringsToVehicleClassEnumsMap,
  getStringsToZevClassEnumsMap,
} from "@/app/lib/utils/enumMaps";
import { ModelYear } from "@/prisma/generated/enums";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

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

  return (
    <div>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="py-2 pr-3 text-left font-semibold text-primaryText">
              Vehicle Class
            </th>
            <th className="py-2 pr-3 text-left font-semibold text-primaryText">
              ZEV Class
            </th>
            <th className="py-2 pr-3 text-left font-semibold text-primaryText">
              Model Year
            </th>
            <th className="py-2 pr-3 text-left font-semibold text-primaryText">
              Number of Units
            </th>
            <th className="py-2 pr-3 text-left font-semibold text-primaryText">
              Dollar per Value Unit
            </th>
            <th className="py-2 text-left font-semibold text-primaryText">
              Delete
            </th>
          </tr>
        </thead>
        <tbody>
          {props.lines.map((line, index) => (
            <tr key={index} className="border-b border-gray-100">
              <td className="py-2 pr-3">
                <Dropdown
                  id={`vehicleClass-${index}`}
                  options={Object.entries(vehicleClassesMap).map(
                    ([key, value]) => ({
                      value: value as string,
                      label: key,
                    }),
                  )}
                  value={line.vehicleClass}
                  onChange={(value) =>
                    props.handleLineChange(index, "vehicleClass", value)
                  }
                  disabled={props.disabled}
                />
              </td>
              <td className="py-2 pr-3">
                <Dropdown
                  id={`zevClass-${index}`}
                  options={Object.entries(zevClassesMap).map(([key, value]) => ({
                    value: value as string,
                    label: key,
                  }))}
                  value={line.zevClass}
                  onChange={(value) =>
                    props.handleLineChange(index, "zevClass", value)
                  }
                  disabled={props.disabled}
                />
              </td>
              <td className="py-2 pr-3">
                <Dropdown
                  id={`modelYear-${index}`}
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
                  disabled={props.disabled}
                />
              </td>
              <td className="py-2 pr-3">
                <input
                  type="text"
                  className="h-10 w-full rounded border border-gray-300 px-3 text-sm focus:border-primaryBlue focus:outline-none"
                  value={line.numberOfUnits}
                  onChange={(e) =>
                    props.handleLineChange(index, "numberOfUnits", e.target.value)
                  }
                  disabled={props.disabled}
                />
              </td>
              <td className="py-2 pr-3">
                <input
                  type="text"
                  className="h-10 w-full rounded border border-gray-300 px-3 text-sm focus:border-primaryBlue focus:outline-none"
                  value={line.dollarValuePerUnit}
                  onChange={(e) =>
                    props.handleLineChange(
                      index,
                      "dollarValuePerUnit",
                      e.target.value,
                    )
                  }
                  disabled={props.disabled}
                />
              </td>
              <td className="py-2">
                <button
                  type="button"
                  onClick={() => props.removeLine(index)}
                  disabled={props.disabled}
                  className="bg-transparent p-1 text-primaryRed hover:text-primaryRedHover disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none"
                  aria-label="Delete line"
                >
                  <FontAwesomeIcon icon={faTrash} className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
