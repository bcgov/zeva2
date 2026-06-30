import { JSX } from "react";
import { FileZevUnitRecord } from "../utils";

export const ParsedZevUnitRecords = (props: {
  caption: string;
  records: FileZevUnitRecord[];
  hideIfEmpty?: boolean;
}) => {
  const headerClasses =
    "px-4 py-3 border-b border-dividerMedium font-bold text-sm";
  const cellClasses = "px-4 py-3 text-sm";
  const entries: JSX.Element[] = [];
  for (const [index, record] of props.records.entries()) {
    const borderClasses =
      index === props.records.length - 1 ? "" : "border-b border-dividerMedium";
    const backgroundClasses = index % 2 === 0 ? "bg-lightGrey" : "";
    entries.push(
      <div
        key={`${index}-type`}
        className={`${cellClasses} ${borderClasses} ${backgroundClasses}`}
      >
        {record.type}
      </div>,
      <div
        key={`${index}-vc`}
        className={`${cellClasses} ${borderClasses} ${backgroundClasses}`}
      >
        {record.vehicleClass}
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
  if (entries.length === 0) {
    if (props.hideIfEmpty) {
      return null;
    }
    for (let i = 0; i < 5; i++) {
      entries.push(
        <div key={i} className={`${cellClasses}`}>
          -
        </div>,
      );
    }
  }
  return (
    <div className="flex flex-col border border-dividerMedium rounded">
      <div className="px-5 py-4 font-bold text-xl bg-disabledBG border-b border-dividerMedium">
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
