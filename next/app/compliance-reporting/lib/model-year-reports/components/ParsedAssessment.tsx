import { ParsedAssmnt } from "../utils";
import { ParsedComplianceReductions } from "./ParsedComplianceReductions";
import { ParsedZevUnitRecords } from "./ParsedZevUnitRecords";

export const ParsedAssessment = (props: { assessment: ParsedAssmnt }) => {
  return (
    <div className="flex-col space-y-2">
      <table className="w-full text-left">
        <thead>
          <tr>
            <th className="border border-gray-300">Classification</th>
            <th className="border border-gray-300">ZEV Class Ordering</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-gray-300">
              {props.assessment.details.classification}
            </td>
            <td className="border border-gray-300">
              {props.assessment.details.zevClassOrdering}
            </td>
          </tr>
        </tbody>
      </table>
      <ParsedComplianceReductions
        reductions={props.assessment.complianceReductions}
      />
      <ParsedZevUnitRecords
        caption="Beginning Balance"
        records={props.assessment.beginningBalance}
      />
      <ParsedZevUnitRecords
        caption="Credits Earned during Compliance Period"
        records={props.assessment.credits}
      />
      <ParsedZevUnitRecords
        caption="Previous Adjustments"
        records={props.assessment.previousAdjustments}
      />
      <ParsedZevUnitRecords
        caption="Current Adjustments"
        records={props.assessment.currentAdjustments}
      />
      <ParsedZevUnitRecords
        caption="Offsets and Transfers Away"
        records={props.assessment.offsetsAndTransfersAway}
      />
      <table className="w-full text-left">
        <caption className="text-left">Final Ending Balance</caption>
        <thead>
          <tr>
            <th className="border border-gray-300">Type</th>
            <th className="border border-gray-300">Vehicle Class</th>
            <th className="border border-gray-300">ZEV Class</th>
            <th className="border border-gray-300">Model Year</th>
            <th className="border border-gray-300">Initial Number of Units</th>
            <th className="border border-gray-300">Divisor</th>
            <th className="border border-gray-300">Final Number of Units</th>
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
      <table className="w-full text-left">
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
