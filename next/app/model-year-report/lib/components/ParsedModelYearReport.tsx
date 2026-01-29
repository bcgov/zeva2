import { ParsedMyr } from "../utils";
import { ParsedComplianceReductions } from "./ParsedComplianceReductions";
import { ParsedZevUnitRecords } from "./ParsedZevUnitRecords";

export const ParsedModelYearReport = (props: { myr: ParsedMyr }) => {
  return (
    <div className="flex-col space-y-2">
      <table key="details" className="w-full text-left">
        <thead>
          <tr>
            <th key="modelYear" className="border border-gray-300">
              Model Year
            </th>
            <th key="zevClassOrdering" className="border border-gray-300">
              ZEV Class Ordering
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td key="modelYear" className="border border-gray-300">
              {props.myr.details.modelYear}
            </td>
            <td key="zevClassOrdering" className="border border-gray-300">
              {props.myr.details.zevClassOrdering}
            </td>
          </tr>
        </tbody>
      </table>
      <table key="supplierDetails" className="w-full text-left">
        <caption className="text-left">Supplier Details</caption>
        <thead>
          <tr>
            <th key="legalName" className="border border-gray-300">
              Legal Name
            </th>
            <th key="makes" className="border border-gray-300">
              Makes
            </th>
            <th key="classification" className="border border-gray-300">
              Classification
            </th>
            <th key="serviceAddress" className="border border-gray-300">
              Service Address
            </th>
            <th key="recordsAddress" className="border border-gray-300">
              Records Address
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td key="legalName" className="border border-gray-300">
              {props.myr.supplierDetails.legalName}
            </td>
            <td key="makes" className="border border-gray-300">
              {props.myr.supplierDetails.makes}
            </td>
            <td key="classification" className="border border-gray-300">
              {props.myr.supplierDetails.classification}
            </td>
            <td key="serviceAddress" className="border border-gray-300">
              {props.myr.supplierDetails.serviceAddress}
            </td>
            <td key="recordsAddress" className="border border-gray-300">
              {props.myr.supplierDetails.recordsAddress}
            </td>
          </tr>
        </tbody>
      </table>
      <table key="vehicleStatistics" className="w-full text-left">
        <caption className="text-left">ZEV Statistics</caption>
        <thead>
          <tr>
            <th key="vehicleClass" className="border border-gray-300">
              Vehicle Class
            </th>
            <th key="zevClass" className="border border-gray-300">
              ZEV Class
            </th>
            <th key="make" className="border border-gray-300">
              Make
            </th>
            <th key="modelName" className="border border-gray-300">
              Model Name
            </th>
            <th key="modelYear" className="border border-gray-300">
              Model Year
            </th>
            <th key="zevType" className="border border-gray-300">
              ZEV Type
            </th>
            <th key="range" className="border border-gray-300">
              Range
            </th>
            <th key="submittedCount" className="border border-gray-300">
              Pending Issuance Count
            </th>
            <th key="issuedCount" className="border border-gray-300">
              Issued Count
            </th>
          </tr>
        </thead>
        <tbody>
          {props.myr.vehicleStatistics.map((vehicle) => (
            <tr key={crypto.randomUUID()}>
              <td key="vehicleClass" className="border border-gray-300">
                {vehicle.vehicleClass}
              </td>
              <td key="zevClass" className="border border-gray-300">
                {vehicle.zevClass}
              </td>
              <td key="make" className="border border-gray-300">
                {vehicle.make}
              </td>
              <td key="modelName" className="border border-gray-300">
                {vehicle.modelName}
              </td>
              <td key="modelYear" className="border border-gray-300">
                {vehicle.modelYear}
              </td>
              <td key="zevType" className="border border-gray-300">
                {vehicle.zevType}
              </td>
              <td key="range" className="border border-gray-300">
                {vehicle.range}
              </td>
              <td key="submittedCount" className="border border-gray-300">
                {vehicle.submittedCount}
              </td>
              <td key="issuedCount" className="border border-gray-300">
                {vehicle.issuedCount}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ParsedComplianceReductions
        key="complianceReductions"
        reductions={props.myr.complianceReductions}
      />
      <ParsedZevUnitRecords
        key="beginningBalance"
        caption="Beginning Balance"
        records={props.myr.beginningBalance}
      />
      <ParsedZevUnitRecords
        key="credits"
        caption="Credits Earned during Compliance Period"
        records={props.myr.credits}
      />
      <ParsedZevUnitRecords
        key="offsetsAndTransfersAway"
        caption="Offsets and Transfers Away"
        records={props.myr.offsetsAndTransfersAway}
      />
      <ParsedZevUnitRecords
        key="prelimEndingBalance"
        caption="Preliminary Ending Balance"
        records={props.myr.prelimEndingBalance}
      />
    </div>
  );
};
