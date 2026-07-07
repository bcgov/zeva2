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
    <div className="flex items-center self-stretch rounded border border-[#898785]">
      {/* Vehicle Class */}
      <div className="flex flex-col items-start flex-1">
        <div className="flex h-[60px] items-center self-stretch gap-3 px-4 pt-3 pb-[13px] rounded-tl border-b border-[#898785] bg-white">
          <span className="text-[#2D2D2D] font-['BC_Sans'] text-sm font-bold leading-[21px]">
            Vehicle Class
          </span>
        </div>
        {props.lines.map((line, index) => (
          <div
            key={index}
            className="flex h-[60px] items-center self-stretch gap-[10px] px-4 py-3 rounded-bl bg-[#F7F9FC]"
          >
            <Dropdown
              id={`vehicleClass-${index}`}
              className="flex-1"
              options={Object.entries(vehicleClassesMap).map(([key, value]) => ({
                value: value as string,
                label: key,
              }))}
              value={line.vehicleClass}
              onChange={(value) =>
                props.handleLineChange(index, "vehicleClass", value)
              }
              disabled={props.disabled}
            />
          </div>
        ))}
      </div>

      {/* ZEV Class */}
      <div className="flex flex-col items-start flex-1">
        <div className="flex h-[60px] items-center self-stretch gap-3 px-4 pt-3 pb-[13px] border-b border-[#898785] bg-white">
          <span className="text-[#2D2D2D] font-['BC_Sans'] text-sm font-bold leading-[21px]">
            ZEV Class
          </span>
        </div>
        {props.lines.map((line, index) => (
          <div
            key={index}
            className="flex h-[60px] items-center self-stretch gap-[10px] px-4 py-3 bg-[#F7F9FC]"
          >
            <Dropdown
              id={`zevClass-${index}`}
              className="flex-1"
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
          </div>
        ))}
      </div>

      {/* Model Year */}
      <div className="flex flex-col items-start flex-1">
        <div className="flex h-[60px] items-center self-stretch gap-3 px-4 pt-3 pb-[13px] border-b border-[#898785] bg-white">
          <span className="text-[#2D2D2D] font-['BC_Sans'] text-sm font-bold leading-[21px]">
            Model Year
          </span>
        </div>
        {props.lines.map((line, index) => (
          <div
            key={index}
            className="flex h-[60px] items-center self-stretch gap-[10px] px-4 py-3 bg-[#F7F9FC]"
          >
            <Dropdown
              id={`modelYear-${index}`}
              className="flex-1"
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
          </div>
        ))}
      </div>

      {/* Number of Units */}
      <div className="flex flex-col items-start flex-1">
        <div className="flex h-[60px] items-center self-stretch gap-3 px-4 pt-3 pb-[13px] border-b border-[#898785] bg-white">
          <span className="text-[#2D2D2D] font-['BC_Sans'] text-sm font-bold leading-[21px]">
            Number of Units
          </span>
        </div>
        {props.lines.map((line, index) => (
          <div
            key={index}
            className="flex h-[60px] items-center self-stretch gap-[10px] px-4 py-3 bg-[#F7F9FC]"
          >
            <input
              type="text"
              placeholder="Search.."
              className="h-10 min-w-[100px] flex-1 px-4 py-3 rounded border border-[#898785] bg-white text-sm"
              value={line.numberOfUnits}
              onChange={(e) =>
                props.handleLineChange(index, "numberOfUnits", e.target.value)
              }
              disabled={props.disabled}
            />
          </div>
        ))}
      </div>

      {/* Dollar per Value Unit */}
      <div className="flex flex-col items-start flex-1">
        <div className="flex h-[60px] items-center self-stretch gap-3 px-4 pt-3 pb-[13px] border-b border-[#898785] bg-white">
          <span className="text-[#2D2D2D] font-['BC_Sans'] text-sm font-bold leading-[21px]">
            Dollar per Value Unit
          </span>
        </div>
        {props.lines.map((line, index) => (
          <div
            key={index}
            className="flex h-[60px] items-center self-stretch gap-[10px] px-4 py-3 bg-[#F7F9FC]"
          >
            <input
              type="text"
              placeholder="Search.."
              className="h-10 min-w-[100px] flex-1 px-4 py-3 rounded border border-[#898785] bg-white text-sm"
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
          </div>
        ))}
      </div>

      {/* Delete */}
      <div className="flex flex-col items-start">
        <div className="flex h-[60px] items-center self-stretch gap-3 px-4 pt-3 pb-[13px] rounded-tr border-b border-[#898785] bg-white">
          <span className="text-[#2D2D2D] font-['BC_Sans'] text-sm font-bold leading-[21px]">
            Delete
          </span>
        </div>
        {props.lines.map((line, index) => (
          <div
            key={index}
            className="flex h-[60px] items-center self-stretch gap-[10px] px-4 py-3 rounded-br bg-[#F7F9FC]"
          >
            <button
              type="button"
              onClick={() => props.removeLine(index)}
              disabled={props.disabled}
              className="bg-transparent p-1 text-primaryRed hover:text-primaryRedHover disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none"
              aria-label="Delete line"
            >
              <FontAwesomeIcon icon={faTrash} className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
