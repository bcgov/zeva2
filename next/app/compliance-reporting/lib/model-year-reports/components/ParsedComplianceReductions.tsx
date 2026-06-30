import { JSX } from "react";
import { FileReductionRecord } from "../utils";

export const ParsedComplianceReductions = (props: {
  reductions: FileReductionRecord[];
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
  );
};
