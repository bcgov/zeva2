import { getUserInfo } from "@/auth";
import {
  getMyrModelYear,
  getSupplierOwnData,
  getSupplierOwnVehicleStats,
} from "../data";
import { ModelYearReportForm } from "./ModelYearReportForm";
import { MyrSuppBanner } from "./MyrSuppBanner";

export const NewPage = async () => {
  const { userIsGov } = await getUserInfo();
  if (userIsGov) {
    return null;
  }
  const modelYear = await getMyrModelYear();
  if (!modelYear) {
    return null;
  }
  const supplierData = await getSupplierOwnData();
  const vehicleStats = await getSupplierOwnVehicleStats(modelYear);
  return (
    <div className="flex flex-col gap-2 p-2">
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
      />
      <ModelYearReportForm
        type="newMyr"
        modelYear={modelYear}
        supplierData={supplierData}
        vehicleStatistics={vehicleStats}
      />
    </div>
  );
};
