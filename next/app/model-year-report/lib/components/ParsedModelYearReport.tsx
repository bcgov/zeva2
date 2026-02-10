import { ParsedMyr } from "../utils";
import { ParsedComplianceReductions } from "./ParsedComplianceReductions";
import { ParsedZevUnitRecords } from "./ParsedZevUnitRecords";

export const ParsedModelYearReport = (props: { myr: ParsedMyr }) => {
  return (
    <div className="flex-col space-y-2">
      <table className="w-full text-left">
        <caption className="text-left">Supplier Details</caption>
        <thead>
          <tr>
            <th className="border border-gray-300">Legal Name</th>
            <th className="border border-gray-300">Makes</th>
            <th className="border border-gray-300">Classification</th>
            <th className="border border-gray-300">Service Address</th>
            <th className="border border-gray-300">Records Address</th>
            <th className="border border-gray-300">ZEV Class Ordering</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-gray-300">
              {props.myr.supplierDetails.legalName}
            </td>
            <td className="border border-gray-300">
              {props.myr.supplierDetails.makes}
            </td>
            <td className="border border-gray-300">
              {props.myr.supplierDetails.classification}
            </td>
            <td className="border border-gray-300">
              {props.myr.supplierDetails.serviceAddress}
            </td>
            <td className="border border-gray-300">
              {props.myr.supplierDetails.recordsAddress}
            </td>
            <td className="border border-gray-300">
              {props.myr.supplierDetails.zevClassOrdering}
            </td>
          </tr>
        </tbody>
      </table>
      <table className="w-full text-left">
        <caption className="text-left">Previous Volumes</caption>
        <thead>
          <tr>
            <th className="border border-gray-300">Vehicle Class</th>
            <th className="border border-gray-300">Model Year</th>
            <th className="border border-gray-300">Volume</th>
          </tr>
        </thead>
        <tbody>
          {props.myr.previousVolumes.map((volume) => (
            <tr key={crypto.randomUUID()}>
              <td className="border border-gray-300">{volume.vehicleClass}</td>
              <td className="border border-gray-300">{volume.modelYear}</td>
              <td className="border border-gray-300">{volume.volume}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <table className="w-full text-left">
        <caption className="text-left">ZEV Statistics</caption>
        <thead>
          <tr>
            <th className="border border-gray-300">Vehicle Class</th>
            <th className="border border-gray-300">ZEV Class</th>
            <th className="border border-gray-300">Make</th>
            <th className="border border-gray-300">Model Name</th>
            <th className="border border-gray-300">Model Year</th>
            <th className="border border-gray-300">ZEV Type</th>
            <th className="border border-gray-300">Range</th>
            <th className="border border-gray-300">Pending Issuance Count</th>
            <th className="border border-gray-300">Issued Count</th>
          </tr>
        </thead>
        <tbody>
          {props.myr.vehicleStatistics.map((vehicle) => (
            <tr key={crypto.randomUUID()}>
              <td className="border border-gray-300">{vehicle.vehicleClass}</td>
              <td className="border border-gray-300">{vehicle.zevClass}</td>
              <td className="border border-gray-300">{vehicle.make}</td>
              <td className="border border-gray-300">{vehicle.modelName}</td>
              <td className="border border-gray-300">{vehicle.modelYear}</td>
              <td className="border border-gray-300">{vehicle.zevType}</td>
              <td className="border border-gray-300">{vehicle.range}</td>
              <td className="border border-gray-300">
                {vehicle.submittedCount}
              </td>
              <td className="border border-gray-300">{vehicle.issuedCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <ParsedComplianceReductions reductions={props.myr.complianceReductions} />
      <ParsedZevUnitRecords
        caption="Beginning Balance"
        records={props.myr.beginningBalance}
      />
      <ParsedZevUnitRecords
        caption="Credits Earned during Compliance Period"
        records={props.myr.credits}
      />
      <ParsedZevUnitRecords
        caption="Pending Supply Credits"
        records={props.myr.pendingSupplyCredits.map((credit) => {
          return { type: "Credit", ...credit };
        })}
      />
      <ParsedZevUnitRecords
        caption="Adjustments"
        records={props.myr.adjustments}
      />
      <ParsedZevUnitRecords
        caption="Suggested Adjustments"
        records={props.myr.suggestedAdjustments}
      />
      <ParsedZevUnitRecords
        caption="Offsets and Transfers Away"
        records={props.myr.offsetsAndTransfersAway}
      />
      <ParsedZevUnitRecords
        caption="Preliminary Ending Balance"
        records={props.myr.prelimEndingBalance}
      />
    </div>
  );
};
