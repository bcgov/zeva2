import { ParsedMyr } from "../utils";

export const ParsedModelYearReport = (props: { myr: ParsedMyr }) => {
  const tableClasses = {
    table: "w-full text-left",
    caption: "text-left",
    th: "border border-gray-300",
    td: "border border-gray-300",
  };

  const getRecordsTable = (
    key: string,
    caption: string,
    zevUnits: Partial<Record<string, string>>[],
  ) => {
    const recordsJSX = zevUnits.map((record) => {
      return (
        <tr key={crypto.randomUUID()}>
          <td key="type" className={tableClasses.td}>
            {record.type}
          </td>
          <td key="vehicleClass" className={tableClasses.td}>
            {record.vehicleClass}
          </td>
          <td key="zevClass" className={tableClasses.td}>
            {record.zevClass}
          </td>
          <td key="modelYear" className={tableClasses.td}>
            {record.modelYear}
          </td>
          <td key="numberOfUnits" className={tableClasses.td}>
            {record.numberOfUnits}
          </td>
        </tr>
      );
    });
    return (
      <table key={key} className={tableClasses.table}>
        <caption className={tableClasses.caption}>{caption}</caption>
        <thead>
          <tr>
            <th key="type" className={tableClasses.th}>
              Type
            </th>
            <th key="vehicleClass" className={tableClasses.th}>
              Vehicle Class
            </th>
            <th key="zevClass" className={tableClasses.th}>
              ZEV Class
            </th>
            <th key="modelYear" className={tableClasses.th}>
              Model Year
            </th>
            <th key="numberOfUnits" className={tableClasses.th}>
              Number of Units
            </th>
          </tr>
        </thead>
        <tbody>{recordsJSX}</tbody>
      </table>
    );
  };

  return (
    <div className="flex-col space-y-2">
      <table key="base" className={tableClasses.table}>
        <thead>
          <tr>
            <th key="modelYear" className={tableClasses.th}>
              Model Year
            </th>
            <th key="zevClassOrdering" className={tableClasses.th}>
              ZEV Class Ordering
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td key="modelYear" className={tableClasses.td}>
              {props.myr.modelYear}
            </td>
            <td key="zevClassOrdering" className={tableClasses.td}>
              {props.myr.zevClassOrdering}
            </td>
          </tr>
        </tbody>
      </table>
      <table key="supplierDetails" className={tableClasses.table}>
        <caption className={tableClasses.caption}>Supplier Details</caption>
        <thead>
          <tr>
            <th key="legalName" className={tableClasses.th}>
              Legal Name
            </th>
            <th key="makes" className={tableClasses.th}>
              Makes
            </th>
            <th key="classification" className={tableClasses.th}>
              Classification
            </th>
            <th key="serviceAddress" className={tableClasses.th}>
              Service Address
            </th>
            <th key="recordsAddress" className={tableClasses.th}>
              Records Address
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td key="legalName" className={tableClasses.td}>
              {props.myr.supplierDetails.legalName}
            </td>
            <td key="makes" className={tableClasses.td}>
              {props.myr.supplierDetails.makes}
            </td>
            <td key="classification" className={tableClasses.td}>
              {props.myr.supplierDetails.classification}
            </td>
            <td key="serviceAddress" className={tableClasses.td}>
              {props.myr.supplierDetails.serviceAddress}
            </td>
            <td key="recordsAddress" className={tableClasses.td}>
              {props.myr.supplierDetails.recordsAddress}
            </td>
          </tr>
        </tbody>
      </table>
      <table key="complianceReductions" className={tableClasses.table}>
        <caption className={tableClasses.caption}>
          Compliance Reductions
        </caption>
        <thead>
          <tr>
            <th key="complianceRatio" className={tableClasses.th}>
              Compliance Ratio
            </th>
            <th key="nv" className={tableClasses.th}>
              NV
            </th>
            <th key="vehicleClass" className={tableClasses.th}>
              Vehicle Class
            </th>
            <th key="zevClass" className={tableClasses.th}>
              ZEV Class
            </th>
            <th key="modelYear" className={tableClasses.th}>
              Model Year
            </th>
            <th key="numberOfUnits" className={tableClasses.th}>
              Number of Units
            </th>
          </tr>
        </thead>
        <tbody>
          {props.myr.complianceReductions.map((reduction) => (
            <tr key={crypto.randomUUID()}>
              <td key="complianceRatio" className={tableClasses.td}>
                {reduction.complianceRatio}
              </td>
              <td key="nv" className={tableClasses.td}>
                {reduction.nv}
              </td>
              <td key="vehicleClass" className={tableClasses.td}>
                {reduction.vehicleClass}
              </td>
              <td key="zevClass" className={tableClasses.td}>
                {reduction.zevClass}
              </td>
              <td key="modelYear" className={tableClasses.td}>
                {reduction.modelYear}
              </td>
              <td key="numberOfUnits" className={tableClasses.td}>
                {reduction.numberOfUnits}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {getRecordsTable(
        "prevBalance",
        "Previous Balance",
        props.myr.prevBalance,
      )}
      {getRecordsTable(
        "credits",
        "Credits Earned during Compliance Period",
        props.myr.credits,
      )}
      {getRecordsTable(
        "offsetsAndTransfersAway",
        "Offsets and Transfers Away",
        props.myr.offsetsAndTransfersAway,
      )}
      {getRecordsTable(
        "prelimEndingBalance",
        "Preliminary Ending Balance",
        props.myr.prelimEndingBalance,
      )}
    </div>
  );
};
