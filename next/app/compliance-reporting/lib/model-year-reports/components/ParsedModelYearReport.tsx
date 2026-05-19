import { ModelYear } from "@/prisma/generated/enums";
import { getZevClassOrder, ParsedMyr, prevBalancesEqual } from "../utils";
import { ParsedComplianceReductions } from "./ParsedComplianceReductions";
import { ParsedZevUnitRecords } from "./ParsedZevUnitRecords";
import {
  getAdjacentYear,
  getComplianceDate,
} from "@/app/lib/utils/complianceYear";
import { getIsoYmdString } from "@/app/lib/utils/date";
import { getModelYearEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { SupplierInformation } from "./SupplierInformation";
import { PreviousVolumes } from "./PreviousVolumes";
import { Makes } from "./Makes";
import { ZevClassOrder } from "./ZevClassOrder";
import { ZevStatistics } from "./ZevStatistics";

export const ParsedModelYearReport = (props: {
  type: "myr" | "supp";
  modelYear: ModelYear;
  myr: ParsedMyr;
}) => {
  const prevCy = getAdjacentYear("prev", props.modelYear);
  const prevCd = getComplianceDate(prevCy);
  const prevCdString = getIsoYmdString(prevCd);
  const modelYearsMap = getModelYearEnumsToStringsMap();
  const reportType =
    props.type === "myr" ? "Model Year Report" : "Supplementary Report";
  const zevClassOrder = getZevClassOrder(
    props.myr.supplierDetails.zevClassOrdering,
  );
  return (
    <div className="flex flex-col gap-2 border border-dividerMedium/40 pb-2">
      <div className="p-2 font-semibold font-lg bg-gray-100">
        {modelYearsMap[props.modelYear]} {reportType}
      </div>
      <div className="flex flex-row gap-2 px-2">
        <div className="flex-1">
          <SupplierInformation details={props.myr.supplierDetails} />
        </div>
        <div className="flex-1">
          <PreviousVolumes
            modelYear={props.modelYear}
            volumes={props.myr.previousVolumes}
          />
        </div>
      </div>
      <div className="flex flex-row flex-1 gap-2 px-2">
        <div className="flex-1">
          <Makes makes={props.myr.supplierDetails.makes} disabled={true} />
        </div>
        <div className="flex-1">
          <ZevClassOrder
            modelYear={props.modelYear}
            zevClassOrder={zevClassOrder}
            disabled={true}
          />
        </div>
      </div>
      <div className="p-2 font-semibold font-lg bg-gray-100">
        Compliance Obligation
      </div>
      <div className="flex flex-col gap-2 px-2">
        <ParsedComplianceReductions
          reductions={props.myr.complianceReductions}
        />
        <ParsedZevUnitRecords
          caption={`Balance at end of ${prevCdString}`}
          records={props.myr.prevEndOfCdBalance}
        />
        {!prevBalancesEqual(props.myr.prevEndOfCdBalance, props.myr.prevAfterCdBalance) && (
          <ParsedZevUnitRecords
            caption={`Balance immediately after ${prevCdString}`}
            records={props.myr.prevAfterCdBalance}
          />
        )}
        <ParsedZevUnitRecords
          caption="Credit Activity"
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
          caption="Transfers Away"
          records={props.myr.offsetsAndTransfersAway}
        />
        <ParsedZevUnitRecords
          caption="Preliminary Ending Balance"
          records={props.myr.prelimEndingBalance}
        />
        <ZevStatistics
          modelYear={props.modelYear}
          records={props.myr.vehicleStatistics}
        />
      </div>
    </div>
  );
};
