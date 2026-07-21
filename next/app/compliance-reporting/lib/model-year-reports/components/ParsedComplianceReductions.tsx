import { JSX } from "react";
import { FileReductionRecord, FileZevAndIceCountRecord } from "../utils";
import { ModelYear, ZevClass } from "@/prisma/generated/enums";
import {
  getStringsToModelYearsEnumsMap,
  getStringsToZevClassEnumsMap,
} from "@/app/lib/utils/enumMaps";
import Decimal from "decimal.js";

export const ParsedComplianceReductions = (props: {
  reductions: FileReductionRecord[];
  zevAndIceCounts: FileZevAndIceCountRecord[];
}) => {
  const headerClasses =
    "px-4 py-3 border-b border-dividerMedium font-bold text-sm";
  const cellClasses = "px-4 py-3 text-sm";
  const entries: JSX.Element[] = [];
  for (const [index, record] of props.reductions.entries()) {
    const borderClasses =
      index === props.reductions.length - 1
        ? ""
        : "border-b border-dividerMedium";
    const backgroundClasses = index % 2 === 0 ? "bg-lightGrey" : "";
    entries.push(
      <div
        key={`${index}-vc`}
        className={`${cellClasses} ${borderClasses} ${backgroundClasses}`}
      >
        {record.vehicleClass}
      </div>,
      <div
        key={`${index}-ratio`}
        className={`${cellClasses} ${borderClasses} ${backgroundClasses}`}
      >
        {record.ratio}
      </div>,
      <div
        key={`${index}-nv`}
        className={`${cellClasses} ${borderClasses} ${backgroundClasses}`}
      >
        {record.nv}
      </div>,
      <div
        key={`${index}-zc`}
        className={`${cellClasses} ${borderClasses} ${backgroundClasses}`}
      >
        {record.zevClass}
      </div>,
      <div
        key={`${index}-my`}
        className={`${cellClasses} ${borderClasses} ${backgroundClasses}`}
      >
        {record.modelYear}
      </div>,
      <div
        key={`${index}-nou`}
        className={`${cellClasses} ${borderClasses} ${backgroundClasses}`}
      >
        {record.numberOfUnits}
      </div>,
    );
  }

  const getAdditionalTable = () => {
    if (props.reductions.length !== 1 && props.reductions.length !== 2) {
      return null;
    }
    const vehicleClasses = new Set<string>();
    const modelYears = new Set<string>();
    const nvValues = new Set<string>();
    for (const reduction of props.reductions) {
      vehicleClasses.add(reduction.vehicleClass);
      modelYears.add(reduction.modelYear);
      nvValues.add(reduction.nv);
    }
    if (
      vehicleClasses.size !== 1 ||
      modelYears.size !== 1 ||
      nvValues.size !== 1
    ) {
      return null;
    }
    if (props.zevAndIceCounts.length !== 1) {
      return null;
    }
    const modelYearsMap = getStringsToModelYearsEnumsMap();
    const zevClassMap = getStringsToZevClassEnumsMap();
    let salesOrSupplied = "Supplied";
    const modelYear = modelYearsMap[Array.from(modelYears)[0]];
    if (modelYear && modelYear < ModelYear.MY_2024) {
      salesOrSupplied = "Sales";
    }
    let unspecifiedPercentage: string | undefined;
    let unspecifiedReduction: string | undefined;
    let aPercentage: string | undefined;
    let aReduction: string | undefined;
    for (const reduction of props.reductions) {
      const zevClass = zevClassMap[reduction.zevClass];
      const percentage = new Decimal(reduction.ratio).times(100).toFixed(2);
      const nou = reduction.numberOfUnits;
      if (zevClass === ZevClass.UNSPECIFIED) {
        unspecifiedPercentage = percentage;
        unspecifiedReduction = nou;
      } else if (zevClass === ZevClass.A) {
        aPercentage = percentage;
        aReduction = nou;
      }
    }
    if (!unspecifiedPercentage || !unspecifiedReduction) {
      return null;
    }
    let totalReduction = new Decimal(unspecifiedReduction);
    if (aReduction) {
      totalReduction = totalReduction.plus(new Decimal(aReduction));
    }
    return (
      <div className="flex flex-col border border-dividerMedium rounded">
        <div className="px-5 py-4 font-bold text-xl bg-disabledBG border-b border-dividerMedium">
          {Array.from(modelYears)[0]} Model Year Vehicles {salesOrSupplied}
        </div>
        <div className="p-5 flex flex-row gap-8">
          <div className="w-1/3 grid grid-cols-2 gap-y-3">
            <div className="font-bold">ZEV Total:</div>
            <div className="font-bold justify-self-end">
              {props.zevAndIceCounts[0].zevCount}
            </div>
            <div className="font-bold">ICE Total:</div>
            <div className="font-bold justify-self-end">
              {props.zevAndIceCounts[0].iceCount}
            </div>
            <hr className="col-span-2 border-disabledBG"></hr>
            <div className="font-bold">Compliance Ratio:</div>
            <div className="font-bold justify-self-end">
              {unspecifiedPercentage}%
            </div>
            {aPercentage && aReduction && (
              <>
                <hr className="col-span-2 border-disabledBG"></hr>
                <div className="font-bold">ZEV Class A Ratio:</div>
                <div className="font-bold justify-self-end">{aPercentage}%</div>
              </>
            )}
          </div>
          <div className="border border-dividerMedium"></div>
          <div className="w-1/3 grid grid-cols-2 gap-y-3">
            <div className="font-bold">Compliance Reductions:</div>
            <div className="font-bold justify-self-end">
              {totalReduction.toFixed(2)}
            </div>
            <hr className="col-span-2 border-disabledBG"></hr>
            <div className="font-bold">Unspecified ZEV Class Reduction:</div>
            <div className="font-bold justify-self-end">
              {unspecifiedReduction}
            </div>
            {aPercentage && aReduction && (
              <>
                <hr className="col-span-2 border-disabledBG"></hr>
                <div className="font-bold">ZEV Class A Reduction:</div>
                <div className="font-bold justify-self-end">{aReduction}</div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (entries.length === 0) {
    for (let i = 0; i < 6; i++) {
      entries.push(
        <div key={i} className={`${cellClasses}`}>
          -
        </div>,
      );
    }
  }
  return (
    <div className="flex flex-col gap-10">
      {getAdditionalTable()}
      <div className="flex flex-col border border-dividerMedium rounded">
        <div className="px-5 py-4 font-bold text-xl bg-disabledBG border-b border-dividerMedium">
          Compliance Ratio Reductions
        </div>
        <div className="grid grid-cols-6">
          <div className={headerClasses}>Vehicle Class</div>
          <div className={headerClasses}>Compliance Ratio</div>
          <div className={headerClasses}>NV</div>
          <div className={headerClasses}>ZEV Class</div>
          <div className={headerClasses}>Model Year</div>
          <div className={headerClasses}>Number of Units</div>
          {entries}
        </div>
      </div>
    </div>
  );
};
