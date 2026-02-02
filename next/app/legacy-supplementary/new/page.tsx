import { getUserInfo } from "@/auth";
import { SupplementaryForm } from "@/app/model-year-report/lib/components/SupplementaryForm";

const Page = async () => {
  const { userIsGov } = await getUserInfo();
  if (userIsGov) {
    return null;
  }
  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">
        Create a Legacy Supplementary Report
      </h1>
      <SupplementaryForm type="legacyNew" />
    </div>
  );
};

export default Page;
