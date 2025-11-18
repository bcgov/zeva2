import { ParsedAssmnt } from "../utils";
import { ParsedComplianceReductions } from "./ParsedComplianceReductions";
import { ParsedZevUnitRecords } from "./ParsedZevUnitRecords";

export const ParsedAssessment = (props: { assessment: ParsedAssmnt }) => {
  return (
    <div className="flex-col space-y-2">
      <table key="details" className="w-full text-left">
        <thead>
          <tr>
            <th key="supplierName" className="border border-gray-300">
              Supplier Name
            </th>
            <th key="modelYear" className="border border-gray-300">
              Model Year
            </th>
            <th key="classification" className="border border-gray-300">
              Classification
            </th>
            <th key="zevClassOrdering" className="border border-gray-300">
              ZEV Class Ordering
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td key="supplierName" className="border border-gray-300">
              {props.assessment.details.supplierName}
            </td>
            <td key="modelYear" className="border border-gray-300">
              {props.assessment.details.modelYear}
            </td>
            <td key="classification" className="border border-gray-300">
              {props.assessment.details.classification}
            </td>
            <td key="zevClassOrdering" className="border border-gray-300">
              {props.assessment.details.zevClassOrdering}
            </td>
          </tr>
        </tbody>
      </table>
      <ParsedComplianceReductions
        key="complianceReductions"
        reductions={props.assessment.complianceReductions}
      />
      <ParsedZevUnitRecords
        key="beginningBalance"
        caption="Beginning Balance"
        records={props.assessment.beginningBalance}
      />
      <ParsedZevUnitRecords
        key="credits"
        caption="Credits Earned during Compliance Period"
        records={props.assessment.credits}
      />
      <ParsedZevUnitRecords
        key="prevAdjustments"
        caption="Previous Adjustments"
        records={props.assessment.previousAdjustments}
      />
      <ParsedZevUnitRecords
        key="currentAdjustments"
        caption="Current Adjustments"
        records={props.assessment.currentAdjustments}
      />
      <ParsedZevUnitRecords
        key="offsetsAndTransfersAway"
        caption="Offsets and Transfers Away"
        records={props.assessment.offsetsAndTransfersAway}
      />
      <table key="finalEndingBalance" className="w-full text-left">
        <caption className="text-left">Final Ending Balance</caption>
        <thead>
          <tr>
            <th key="type" className="border border-gray-300">
              Type
            </th>
            <th key="vehicleClass" className="border border-gray-300">
              Vehicle Class
            </th>
            <th key="zevClass" className="border border-gray-300">
              ZEV Class
            </th>
            <th key="modelYear" className="border border-gray-300">
              Model Year
            </th>
            <th key="initialNumberOfUnits" className="border border-gray-300">
              Initial Number of Units
            </th>
            <th key="divisor" className="border border-gray-300">
              Divisor
            </th>
            <th key="finalNumberOfUnits" className="border border-gray-300">
              Final Number of Units
            </th>
          </tr>
        </thead>
        <tbody>
          {props.assessment.finalEndingBalance.map((record) => (
            <tr key={crypto.randomUUID()}>
              <td key="type" className="border border-gray-300">
                {record.type}
              </td>
              <td key="vehicleClass" className="border border-gray-300">
                {record.vehicleClass}
              </td>
              <td key="zevClass" className="border border-gray-300">
                {record.zevClass}
              </td>
              <td key="modelYear" className="border border-gray-300">
                {record.modelYear}
              </td>
              <td key="initialNumberOfUnits" className="border border-gray-300">
                {record.initialNumberOfUnits}
              </td>
              <td key="divisor" className="border border-gray-300">
                {record.divisor}
              </td>
              <td key="finalNumberOfUnits" className="border border-gray-300">
                {record.finalNumberOfUnits}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <table key="statements" className="w-full text-left">
        <caption className="text-left">Statement(s)</caption>
        <thead>
          <tr>
            <th className="border border-gray-300">Statement</th>
          </tr>
        </thead>
        <tbody>
          {props.assessment.statements.map((statement) => (
            <tr key={crypto.randomUUID()}>
              <td className="border border-gray-300">{statement}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
