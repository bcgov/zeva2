// caution: imported into a client component
export const SupplierInformation = (props: {
  legalName: string;
  recordsAddress: string;
  serviceAddress: string;
  classification?: string;
}) => {
  return (
    <div className="flex flex-col border border-dividerMedium rounded">
      <div className="px-5 py-4 text-xl font-bold bg-disabledBG">
        Supplier Information
      </div>
      <div className="p-5 grid grid-cols-2 gap-y-3">
        <div className="font-bold">Legal Name:</div>
        <div>{props.legalName}</div>
        <hr className="col-span-2 border-disabledBG"></hr>
        <div className="font-bold">Records Address:</div>
        <div>{props.recordsAddress}</div>
        <hr className="col-span-2 border-disabledBG"></hr>
        <div className="font-bold">Service Address</div>
        <div>{props.serviceAddress}</div>
        {props.classification && (
          <>
            <hr className="col-span-2 border-disabledBG"></hr>
            <div className="font-bold">Class:</div>
            <div>{props.classification}</div>
          </>
        )}
      </div>
    </div>
  );
};
