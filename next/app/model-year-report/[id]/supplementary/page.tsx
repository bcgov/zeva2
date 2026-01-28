import { getUserInfo } from "@/auth";
import { getModelYearReport } from "../../lib/data";
import { SupplementaryForm } from "../../lib/components/SupplementaryForm";
import { ModelYearReportStatus } from "@/prisma/generated/client";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const args = await props.params;
  const myrId = Number.parseInt(args.id, 10);
  const { userIsGov } = await getUserInfo();
  const report = await getModelYearReport(myrId);
  if (userIsGov || !report || report.status === ModelYearReportStatus.DRAFT) {
    return null;
  }
  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Create a Supplementary Report</h1>
      <SupplementaryForm type="nonLegacyNew" modelYear={report.modelYear} />
    </div>
  );
};

export default Page;
