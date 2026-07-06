import { JSX } from "react";
import { ParsedMyr } from "../utils";
import { ModelYear } from "@/prisma/generated/enums";
import Decimal from "decimal.js";

export const ZevStatistics = (props: {
  modelYear: ModelYear;
  records: ParsedMyr["vehicleStatistics"];
}) => {
  let title = "ZEVs Supplied and Registered";
  if (props.modelYear < ModelYear.MY_2024) {
    title = "ZEV Consumer Sales";
  }
  const headerClasses =
    "px-4 py-3 border-b border-dividerMedium font-bold text-sm";
  const entryClasses = "px-4 py-3 text-sm border-b border-dividerMedium";
  const entries: JSX.Element[] = [];
  let totalIssued = new Decimal(0);
  let totalPending = new Decimal(0);
  let parsingError = false;
  for (const [index, record] of props.records.entries()) {
    const backgroundClasses = index % 2 === 0 ? "bg-lightGrey" : "";
    entries.push(
      <div
        key={`${index}-vc`}
        className={`${entryClasses} ${backgroundClasses}`}
      >
        {record.vehicleClass}
      </div>,
      <div
        key={`${index}-ic`}
        className={`${entryClasses} ${backgroundClasses}`}
      >
        {record.issuedCount}
      </div>,
      <div
        key={`${index}-zc`}
        className={`${entryClasses} ${backgroundClasses}`}
      >
        {record.zevClass}
      </div>,
      <div
        key={`${index}-make`}
        className={`${entryClasses} ${backgroundClasses}`}
      >
        {record.make}
      </div>,
      <div
        key={`${index}-mn`}
        className={`${entryClasses} ${backgroundClasses}`}
      >
        {record.modelName}
      </div>,
      <div
        key={`${index}-my`}
        className={`${entryClasses} ${backgroundClasses}`}
      >
        {record.modelYear}
      </div>,
      <div
        key={`${index}-zt`}
        className={`${entryClasses} ${backgroundClasses}`}
      >
        {record.zevType}
      </div>,
      <div
        key={`${index}-range`}
        className={`${entryClasses} ${backgroundClasses}`}
      >
        {record.range}
      </div>,
      <div
        key={`${index}-sc`}
        className={`${entryClasses} ${backgroundClasses}`}
      >
        {record.submittedCount}
      </div>,
    );
    try {
      totalIssued = totalIssued.plus(new Decimal(record.issuedCount));
      totalPending = totalPending.plus(new Decimal(record.submittedCount));
    } catch (e) {
      parsingError = true;
    }
  }
  if (!parsingError && totalIssued.isInteger() && totalPending.isInteger()) {
    const classNames = "px-4 py-3 text-sm font-bold bg-infoBG";
    entries.push(
      <div key="vc" className={classNames}>
        Total
      </div>,
      <div key="ic" className={classNames}>
        {totalIssued.toFixed(0)}
      </div>,
      <div key="zc" className={classNames}></div>,
      <div key="make" className={classNames}></div>,
      <div key="mn" className={classNames}></div>,
      <div key="my" className={classNames}></div>,
      <div key="zt" className={classNames}></div>,
      <div key="range" className={classNames}></div>,
      <div key="sc" className={classNames}>
        {totalPending.toFixed(0)}
      </div>,
    );
  }
  return (
    <div className="flex flex-col border border-dividerMedium rounded">
      <div className="px-5 py-4 font-bold text-xl bg-disabledBG border-b border-dividerMedium">
        {title}
      </div>
      <div className="grid grid-cols-9">
        <div className={headerClasses}>Vehicle Class</div>
        <div className={headerClasses}>Issued Count</div>
        <div className={headerClasses}>ZEV Class</div>
        <div className={headerClasses}>Make</div>
        <div className={headerClasses}>Model Name</div>
        <div className={headerClasses}>Model Year</div>
        <div className={headerClasses}>ZEV Type</div>
        <div className={headerClasses}>Range</div>
        <div className={headerClasses}>Pending Issuance</div>
        {entries}
      </div>
    </div>
  );
};
