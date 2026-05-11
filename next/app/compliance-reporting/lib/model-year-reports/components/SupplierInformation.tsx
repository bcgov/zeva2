import { ParsedMyr } from "../utils";

export const SupplierInformation = (props: {
  details: ParsedMyr["supplierDetails"];
}) => {
  const cellClass = "p-2 border-b border-dividerMedium/30";
  return (
    <div className="flex flex-col border border-dividerMedium/40">
      <div className="p-2 font-lg font-semibold bg-gray-100">
        Supplier Information
      </div>
      <div className="grid grid-cols-2">
        <div className={cellClass}>Legal Name:</div>
        <div className={cellClass}>{props.details.legalName}</div>
        <div className={cellClass}>Records Address:</div>
        <div className={cellClass}>{props.details.recordsAddress}</div>
        <div className={cellClass}>Service Address</div>
        <div className={cellClass}>{props.details.serviceAddress}</div>
        <div className="p-2">Class:</div>
        <div className="p-2">{props.details.classification}</div>
      </div>
    </div>
  );
};
