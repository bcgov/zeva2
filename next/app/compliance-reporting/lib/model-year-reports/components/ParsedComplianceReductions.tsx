import { JSX } from "react";
import { FileReductionRecord } from "../utils";

export const ParsedComplianceReductions = (props: {
  reductions: FileReductionRecord[];
}) => {
  const headerClasses = "p-2 border-b border-dividerMedium/30 font-semibold";
  const entries: JSX.Element[] = [];
  for (const [index, record] of props.reductions.entries()) {
    const borderClasses =
      index === props.reductions.length - 1
        ? ""
        : "border-b border-dividerMedium/30";
    const backgroundClasses = index % 2 === 1 ? "bg-gray-100" : "";
    entries.push(
      <div
        key={`${index}-vc`}
        className={`p-2 ${borderClasses} ${backgroundClasses}`}
      >
        {record.vehicleClass}
      </div>,
      <div
        key={`${index}-ratio`}
        className={`p-2 ${borderClasses} ${backgroundClasses}`}
      >
        {record.ratio}
      </div>,
      <div
        key={`${index}-nv`}
        className={`p-2 ${borderClasses} ${backgroundClasses}`}
      >
        {record.nv}
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
