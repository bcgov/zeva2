import { JSX } from "react";
import { FileZevUnitRecord } from "../utils";

export const ParsedZevUnitRecords = (props: {
  caption: string;
  records: FileZevUnitRecord[];
}) => {
  const headerClasses = "p-2 border-b border-dividerMedium/30 font-semibold";
  const entries: JSX.Element[] = [];
  for (const [index, record] of props.records.entries()) {
    const borderClasses =
      index === props.records.length - 1
        ? ""
        : "border-b border-dividerMedium/30";
    const backgroundClasses = index % 2 === 1 ? "bg-gray-100" : "";
    entries.push(
      <div
        key={`${index}-type`}
        className={`p-2 ${borderClasses} ${backgroundClasses}`}
      >
        {record.type}
      </div>,
      <div
        key={`${index}-vc`}
        className={`p-2 ${borderClasses} ${backgroundClasses}`}
      >
        {record.vehicleClass}
      </div>,
      <div
        key={`${index}-zc`}
        className={`p-2 ${borderClasses} ${backgroundClasses}`}
      >
        {record.zevClass}
      </div>,
      <div
        key={`${index}-my`}
        className={`p-2 ${borderClasses} ${backgroundClasses}`}
      >
        {record.modelYear}
      </div>,
      <div
        key={`${index}-nou`}
        className={`p-2 ${borderClasses} ${backgroundClasses}`}
      >
        {record.numberOfUnits}
      </div>,
    );
  }
  if (entries.length === 0) {
    return null;
  }
  return (
    <div className="flex flex-col border border-dividerMedium/40">
      <div className="p-2 font-lg font-semibold border-b border-dividerMedium/30 bg-gray-100">
        {props.caption}
      </div>
      <div className="grid grid-cols-5">
        <div className={headerClasses}>Type</div>
        <div className={headerClasses}>Vehicle Class</div>
        <div className={headerClasses}>ZEV Class</div>
        <div className={headerClasses}>Model Year</div>
        <div className={headerClasses}>Number of Units</div>
        {entries}
      </div>
    </div>
  );
};
