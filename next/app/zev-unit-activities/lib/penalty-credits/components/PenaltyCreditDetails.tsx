import {
  getModelYearEnumsToStringsMap,
  getVehicleClassEnumsToStringsMap,
  getZevClassEnumsToStringsMap,
} from "@/app/lib/utils/enumMaps";
import { PenaltyCreditWithOrgName } from "../data";

const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="grid grid-cols-[minmax(140px,2fr)_3fr] gap-4 border-b border-dividerMedium py-3 last:border-b-0">
    <dt className="font-bold text-secondaryText">{label}:</dt>
    <dd className="text-primaryText">{value}</dd>
  </div>
);

export const PenaltyCreditDetails = ({
  penaltyCredit,
}: {
  penaltyCredit: PenaltyCreditWithOrgName;
}) => {
  const modelYearsMap = getModelYearEnumsToStringsMap();
  const vehicleClassMap = getVehicleClassEnumsToStringsMap();
  const zevClassMap = getZevClassEnumsToStringsMap();

  return (
    <section className="overflow-hidden rounded border border-dividerMedium bg-white">
      <h2 className="bg-disabledSurface px-5 py-4 text-xl font-bold text-black">
        Penalty Credit Details
      </h2>
      <div className="grid grid-cols-1 divide-y divide-dividerMedium px-5 md:grid-cols-2 md:divide-x md:divide-y-0">
        <dl className="md:pr-12">
          <DetailRow label="Supplier" value={penaltyCredit.organization.name} />
          <DetailRow
            label="Compliance Year"
            value={modelYearsMap[penaltyCredit.complianceYear]}
          />
          <DetailRow
            label="Vehicle Class"
            value={vehicleClassMap[penaltyCredit.vehicleClass]}
          />
        </dl>
        <dl className="md:pl-12">
          <DetailRow
            label="Model Year"
            value={modelYearsMap[penaltyCredit.modelYear]}
          />
          <DetailRow
            label="ZEV Class"
            value={zevClassMap[penaltyCredit.zevClass]}
          />
          <DetailRow
            label="Number of Units"
            value={penaltyCredit.numberOfUnits.toString()}
          />
        </dl>
      </div>
    </section>
  );
};
