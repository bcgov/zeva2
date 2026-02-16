import { getUserInfo } from "@/auth";
import {
  getModelYearReport,
  getSupplierOwnData,
  getSupplierOwnVehicleStats,
} from "../../lib/data";
import { ModelYearReportForm } from "../../lib/components/ModelYearReportForm";
import { ModelYearReportStatus } from "@/prisma/generated/enums";
import { getDataForSupplementary } from "../../lib/services";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const { userIsGov } = await getUserInfo();
  if (userIsGov) {
    return null;
  }
  const args = await props.params;
  const myrId = Number.parseInt(args.id, 10);
  const report = await getModelYearReport(myrId);
  if (
    !report ||
    report.status === ModelYearReportStatus.DRAFT ||
    report.status === ModelYearReportStatus.RETURNED_TO_SUPPLIER
  ) {
    return null;
  }
  let createSupplementaryPossible = true;
  try {
    await getDataForSupplementary(report.organizationId, report.modelYear);
  } catch {
    createSupplementaryPossible = false;
  }
  if (!createSupplementaryPossible) {
    return null;
  }
  const supplierData = await getSupplierOwnData();
  const vehicleStats = await getSupplierOwnVehicleStats(report.modelYear);
  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Create a Supplementary Report</h1>
      <ModelYearReportForm
        type="nonLegacyNewSupp"
        modelYear={report.modelYear}
        supplierData={supplierData}
        vehicleStatistics={vehicleStats}
      />
    </div>
  );
};

export default Page;
