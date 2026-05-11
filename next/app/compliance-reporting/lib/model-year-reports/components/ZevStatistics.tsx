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
  const headerClasses = "p-2 border-b border-dividerMedium/30 font-semibold";
  const entryClasses = "p-2 border-b border-dividerMedium/30";
  const entries: JSX.Element[] = [];
  let totalIssued = new Decimal(0);
  let totalPending = new Decimal(0);
  let parsingError = false;
  for (const [index, record] of props.records.entries()) {
    const backgroundClasses = index % 2 === 1 ? "bg-gray-100" : "";
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
  if (entries.length === 0) {
    return null;
  }
  if (!parsingError && totalIssued.isInteger() && totalPending.isInteger()) {
    const classNames = "p-2 bg-primaryBlue/10";
    entries.push(
      <div key="vc" className={classNames}></div>,
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
    <div className="flex flex-col border border-dividerMedium/40">
      <div className="p-2 font-lg font-semibold border-b border-dividerMedium/30 bg-gray-100">
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
