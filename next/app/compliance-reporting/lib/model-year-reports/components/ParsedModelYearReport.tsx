import { ModelYear, ModelYearReportStatus } from "@/prisma/generated/enums";
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
import { StatusBanner } from "@/app/lib/components";

export const ParsedModelYearReport = (props: {
  type: "myr" | "supp";
  modelYear: ModelYear;
  status: ModelYearReportStatus;
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
    <div className="flex flex-col border border-dividerMedium rounded">
      <div className="p-5 flex flex-col bg-disabledBG gap-2">
        <span className="font-bold text-xl">
          {modelYearsMap[props.modelYear]} {reportType}
        </span>
        {(props.status === ModelYearReportStatus.DRAFT ||
          props.status === ModelYearReportStatus.RETURNED_TO_SUPPLIER) && (
          <StatusBanner
            variant="info"
            title="Review the information before submitting"
            primaryText="If anything is incorrect, please return to the Report Information section, update the data, and regenerate the report."
          />
        )}
      </div>
      <div className="p-5 grid grid-cols-2 gap-x-6 gap-y-5">
        <SupplierInformation
          legalName={props.myr.supplierDetails.legalName}
          recordsAddress={props.myr.supplierDetails.recordsAddress}
          serviceAddress={props.myr.supplierDetails.serviceAddress}
          classification={props.myr.supplierDetails.classification}
        />
        <PreviousVolumes
          modelYear={props.modelYear}
          volumes={props.myr.previousVolumes}
        />
        <Makes makes={props.myr.supplierDetails.makes} disabled={true} />
        <ZevClassOrder
          modelYear={props.modelYear}
          zevClassOrder={zevClassOrder}
          disabled={true}
        />
      </div>
      <div className="p-5 font-bold text-xl bg-disabledBG">
        Compliance Obligation
      </div>
      <div className="flex flex-col gap-10 p-5">
        <ParsedComplianceReductions
          reductions={props.myr.complianceReductions}
          zevAndIceCounts={props.myr.zevAndIceCounts}
        />
        <ParsedZevUnitRecords
          caption={`Balance at end of ${prevCdString}`}
          records={props.myr.prevEndOfCdBalance}
        />
        {!prevBalancesEqual(
          props.myr.prevEndOfCdBalance,
          props.myr.prevAfterCdBalance,
        ) && (
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
          hideIfEmpty={true}
        />
        <ParsedZevUnitRecords
          caption="Suggested Adjustments"
          records={props.myr.suggestedAdjustments}
          hideIfEmpty={true}
        />
        <ParsedZevUnitRecords
          caption="Offsets and Transfers Away"
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
