"use client";

import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ModelYear, VehicleClass, ZevClass } from "@/prisma/generated/enums";
import { nvMap, zevClassChoiceMap } from "../constants";
import { getZevClassEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { getReportableBalanceABForSupplierUser } from "@/app/zev-unit-activities/lib/zev-unit-transactions/actions";

export const ZevClassOrder = (props: {
  modelYear: ModelYear;
  zevClassOrder: ZevClass[];
  disabled: boolean;
  setZevClassOrder?: Dispatch<SetStateAction<ZevClass[]>>;
  showBalance?: boolean;
}) => {
  const zevClassChoices = useMemo(() => {
    return zevClassChoiceMap[props.modelYear];
  }, [props.modelYear]);

  const zevClassesMap = useMemo(() => {
    return getZevClassEnumsToStringsMap();
  }, []);

  const [choice, setChoice] = useState<ZevClass>();
  const [balance, setBalance] = useState<
    "deficit" | { A: string; B: string }
  >();

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

  useEffect(() => {
    const getAndSetBalance = async () => {
      if (
        props.showBalance &&
        nvMap[props.modelYear]?.includes(VehicleClass.REPORTABLE)
      ) {
        const balance = await getReportableBalanceABForSupplierUser();
        setBalance(balance);
      }
    };
    getAndSetBalance();
  }, [props.showBalance, props.modelYear]);

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
    <div className="flex flex-col border border-dividerMedium rounded">
      <div className="flex flex-col p-5 bg-disabledBG gap-2">
        <span className="font-bold text-xl">
          Compliance Ratio Reduction - ZEV Class Choice
        </span>
        {props.setZevClassOrder && (
          <span>
            Select the ZEV class of credits that should be used first when
            offsetting debits of the unspecified ZEV class.
          </span>
        )}
      </div>
      <div className="flex flex-col p-5 gap-5">
        {balance && balance !== "deficit" && (
          <div className="w-1/6 flex flex-col border border-dividerMedium rounded">
            <div className="p-5 font-bold bg-disabledSurface">
              Your Credit Balance
            </div>
            <div className="p-5 flex flex-col gap-3">
              <div className="flex flex-row gap-4">
                <span className="font-bold">A</span>
                <span className="font-bold">{balance.A}</span>
              </div>
              <hr className="border border-disabledSurface"></hr>
              <div className="flex flex-row gap-4">
                <span className="font-bold">B</span>
                <span className="font-bold">{balance.B}</span>
              </div>
            </div>
          </div>
        )}
        {zevClassChoices.map((zc, index) => {
          return (
            <div key={index} className="flex flex-row gap-3">
              <input
                type="radio"
                checked={choice === zc}
                onChange={() => handleSelect(zc)}
                disabled={props.disabled || !props.setZevClassOrder}
              />
              <span className="font-bold">Zev Class {zevClassesMap[zc]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
