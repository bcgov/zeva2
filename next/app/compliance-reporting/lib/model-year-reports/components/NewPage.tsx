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
import { ReportGenerationInfo } from "./ReportGenerationInfo";
import { SecondaryNavbar } from "@/app/lib/components/SecondaryNavbar";
import { Breadcrumbs } from "@/app/lib/components";
import { getModelYearEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { Routes } from "@/app/lib/constants";

export const NewPage = async () => {
  const { userIsGov, userOrgId } = await getUserInfo();
  if (userIsGov) {
    return null;
  }
  const modelYear = await getMyrModelYear();
  if (!modelYear) {
    return null;
  }
  const myrMap = getModelYearEnumsToStringsMap();
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
      <Breadcrumbs
        items={[
          { label: "Compliance Reporting", href: Routes.ModelYearReports },
          { label: `Create Model Year Report ${myrMap[modelYear]}` },
        ]}
      />
      <SecondaryNavbar
        items={[
          {
            label: `Model Year Report ${myrMap[modelYear]}`,
            route: `${Routes.ModelYearReports}/new`,
          },
          {
            label: "Audit History",
            route: `${Routes.ModelYearReports}/-1/audit-history?modelYear=${myrMap[modelYear]}&detailsType=new`,
          },
        ]}
        activeIndex={0}
      />
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
        statusBanner={{
          variant: "warning",
          title: "STATUS - Draft",
        }}
        bottomBanner={<ReportGenerationInfo modelYear={modelYear} />}
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
