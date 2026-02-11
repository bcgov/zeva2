import { getUserInfo } from "@/auth";
import { ModelYearReportForm } from "@/app/model-year-report/lib/components/ModelYearReportForm";
import {
  getSupplementaryReport,
  getSupplierOwnData,
  getSupplierOwnVehicleStats,
} from "@/app/model-year-report/lib/data";
import { SupplementaryReportStatus } from "@/prisma/generated/client";
import { getPresignedGetObjectUrl } from "@/app/lib/minio";

const Page = async (props: {
  params: Promise<{ id: string; supplementaryId: string }>;
}) => {
  const args = await props.params;
  const suppId = Number.parseInt(args.supplementaryId, 10);
  const { userIsGov } = await getUserInfo();
  const report = await getSupplementaryReport(suppId);
  if (
    userIsGov ||
    !report ||
    report.status !== SupplementaryReportStatus.DRAFT
  ) {
    return null;
  }
  const supplierData = await getSupplierOwnData();
  const vehicleStats = await getSupplierOwnVehicleStats(report.modelYear);
  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Edit a Supplementary Report</h1>
      <ModelYearReportForm
        type="nonLegacySavedSupp"
        modelYear={report.modelYear}
        supplementaryId={suppId}
        url={await getPresignedGetObjectUrl(report.objectName)}
        supplierData={supplierData}
        vehicleStatistics={vehicleStats}
      />
    </div>
  );
};

export default Page;
