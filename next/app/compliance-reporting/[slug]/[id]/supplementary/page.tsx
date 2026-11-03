import { getUserInfo } from "@/auth";
import {
  getModelYearReport,
  getSupplierOwnData,
} from "@/app/compliance-reporting/lib/model-year-reports/data";
import { ModelYearReportForm } from "@/app/compliance-reporting/lib/model-year-reports/components/ModelYearReportForm";
import { ModelYearReportStatus } from "@/prisma/generated/enums";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const { userIsGov } = await getUserInfo();
  if (userIsGov) {
    return null;
  }
  const args = await props.params;
  const myrId = Number.parseInt(args.id, 10);
  const report = await getModelYearReport(myrId);
  if (!report || report.status !== ModelYearReportStatus.ASSESSED) {
    return null;
  }
  const supplierData = await getSupplierOwnData();
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Create a Supplementary Report</h1>
      <ModelYearReportForm
        type="nonLegacyNewSupp"
        myrId={myrId}
        modelYear={report.modelYear}
        supplierData={supplierData}
      />
    </div>
  );
};

export default Page;
