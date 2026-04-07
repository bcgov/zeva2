import { getUserInfo } from "@/auth";
import { ModelYearReportForm } from "../../model-year-reports/components/ModelYearReportForm";
import { getSupplierOwnData } from "../../model-year-reports/data";

export const NewPage = async () => {
  const { userIsGov } = await getUserInfo();
  if (userIsGov) {
    return null;
  }
  const supplierData = await getSupplierOwnData();
  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">
        Create a Legacy Supplementary Report
      </h1>
      <ModelYearReportForm type="legacyNewSupp" supplierData={supplierData} />
    </div>
  );
};
