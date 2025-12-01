import { getModelYearReportModelYear } from "@/app/lib/utils/complianceYear";
import { getUserInfo } from "@/auth";
import { modelYearReportExists } from "../lib/data";
import { ModelYearReportForm } from "../lib/components/ModelYearReportForm";

const Page = async () => {
  const { userIsGov, userOrgName } = await getUserInfo();
  if (userIsGov) {
    return null;
  }
  const modelYear = getModelYearReportModelYear();
  if (!modelYear) {
    return null;
  }
  const reportExists = await modelYearReportExists(modelYear);
  if (reportExists) {
    return null;
  }
  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Submit a Model Year Report</h1>
      <div className="bg-white rounded-lg shadow-level-1 p-6">
        <ModelYearReportForm orgName={userOrgName} modelYear={modelYear} />
      </div>
    </div>
  );
};

export default Page;
