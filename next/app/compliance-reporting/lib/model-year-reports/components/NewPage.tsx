import { getUserInfo } from "@/auth";
import {
  getMyrModelYear,
  getSupplierOwnData,
  getSupplierOwnVehicleStats,
} from "../data";
import { ModelYearReportForm } from "./ModelYearReportForm";
import { MyrSuppBanner } from "./MyrSuppBanner";
import { getSupplierClassAndVolumes } from "../services";
import { getSerializedVolumes } from "../utilsServer";

export const NewPage = async () => {
  const { userIsGov, userOrgId } = await getUserInfo();
  if (userIsGov) {
    return null;
  }
  const modelYear = await getMyrModelYear();
  if (!modelYear) {
    return null;
  }
  const supplierData = await getSupplierOwnData();
  // pass in "0" as we're interested in just the prev volumes
  const { volumes } = await getSupplierClassAndVolumes(
    userOrgId,
    modelYear,
    "0",
  );
  const serializedVolumes = getSerializedVolumes(volumes);
  const vehicleStats = await getSupplierOwnVehicleStats(modelYear);
  return (
    <div className="flex flex-col gap-4 p-2">
      <MyrSuppBanner
        type="myr"
        currentTabIndex={0}
        visibleTabIndices={[0, 1, 2, 4]}
        clickableTabs={{}}
        tabIndicators={{
          0: "inProgress",
          1: "pending",
          2: "pending",
          4: "disabled",
        }}
        modelYear={modelYear}
        includeGenerationinfo={true}
      />
      <ModelYearReportForm
        type="newMyr"
        modelYear={modelYear}
        supplierData={supplierData}
        prevVolumes={serializedVolumes}
        vehicleStatistics={vehicleStats}
      />
    </div>
  );
};
