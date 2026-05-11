"use client";

import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ModelYear, ZevClass } from "@/prisma/generated/enums";
import { zevClassChoiceMap } from "../constants";
import { getZevClassEnumsToStringsMap } from "@/app/lib/utils/enumMaps";

export const ZevClassOrder = (props: {
  modelYear: ModelYear;
  zevClassOrder: ZevClass[];
  setZevClassOrder?: Dispatch<SetStateAction<ZevClass[]>>;
  disabled: boolean;
}) => {
  const zevClassChoices = useMemo(() => {
    return zevClassChoiceMap[props.modelYear];
  }, [props.modelYear]);

  const zevClassesMap = useMemo(() => {
    return getZevClassEnumsToStringsMap();
  }, []);

  const [choice, setChoice] = useState<ZevClass>();

  useEffect(() => {
    if (zevClassChoices && zevClassChoices.length === 2) {
      for (const zc of props.zevClassOrder) {
        if (zevClassChoices.includes(zc)) {
          setChoice(zc);
          break;
        }
      }
    }
  }, [zevClassChoices, props.zevClassOrder]);

  const handleSelect = useCallback(
    (zevClass: ZevClass) => {
      if (
        props.setZevClassOrder &&
        zevClassChoices &&
        zevClassChoices.length === 2
      ) {
        const nonChoices = Object.values(ZevClass).filter((zc) => {
          if (zc === ZevClass.UNSPECIFIED || !zevClassChoices.includes(zc)) {
            return true;
          }
          return false;
        });
        const selectedChoice = zevClassChoices.find((zc) => zc === zevClass);
        const notSelectedChoice = zevClassChoices.find((zc) => zc !== zevClass);
        if (selectedChoice && notSelectedChoice) {
          props.setZevClassOrder([
            ZevClass.UNSPECIFIED,
            selectedChoice,
            notSelectedChoice,
            ...nonChoices,
          ]);
        }
      }
    },
    [zevClassChoices, props.setZevClassOrder],
  );

  if (!zevClassChoices || zevClassChoices.length !== 2) {
    return null;
  }
  return (
    <div className="flex flex-col gap-2 border border-dividerMedium/40">
      <div className="flex flex-col gap-1 p-2 bg-gray-100">
        <span className="font-lg font-bold">
          Compliance Ratio Reduction - ZEV Class Choice
        </span>
        {props.setZevClassOrder && (
          <span>
            Select the ZEV class of credits that should be used first when
            offsetting debits of the unspecified ZEV class.
          </span>
        )}
      </div>
      <div className="flex flex-col p-2 gap-1">
        {zevClassChoices.map((zc, index) => {
          return (
            <div key={index} className="flex flex-row gap-1">
              <input
                type="radio"
                checked={choice === zc}
                onChange={() => handleSelect(zc)}
                disabled={props.disabled || !props.setZevClassOrder}
              />
              <span className="font-semibold">
                Zev Class {zevClassesMap[zc]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
