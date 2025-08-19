import { getUserInfo } from "@/auth";
import { ModelYearReportForm } from "../../lib/components/ModelYearReportForm";
import { getModelYearReport } from "../../lib/data";
import { ModelYearReportStatus } from "@/prisma/generated/client";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const args = await props.params;
  const id = parseInt(args.id, 10);
  const { userIsGov, userOrgName } = await getUserInfo();
  if (userIsGov) {
    return null;
  }
  const myr = await getModelYearReport(id);
  if (!myr || myr.status !== ModelYearReportStatus.RETURNED_TO_SUPPLIER) {
    return null;
  }
  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Resubmit a Model Year Report</h1>
      <ModelYearReportForm
        orgName={userOrgName}
        modelYear={myr.modelYear}
        modelYearReportId={myr.id}
      />
    </div>
  );
};

export default Page;
