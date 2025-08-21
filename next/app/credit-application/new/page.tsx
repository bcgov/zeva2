import { getUserInfo } from "@/auth";
import { CreditApplicationForm } from "../lib/components/CreditApplicationForm";

const Page = async () => {
  const { userIsGov, userOrgName } = await getUserInfo();
  if (userIsGov) {
    return null;
  }
  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Submit a Credit Application</h1>
      <CreditApplicationForm userOrgName={userOrgName} />
    </div>
  );
};

export default Page;
