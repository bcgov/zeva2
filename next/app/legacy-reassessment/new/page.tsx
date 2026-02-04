import { getOrgsMap } from "@/app/lib/data/orgs";
import { AssessmentForm } from "@/app/model-year-report/lib/components/AssessmentForm";
import { getUserInfo } from "@/auth";

const Page = async () => {
  const { userIsGov } = await getUserInfo();
  if (!userIsGov) {
    return null;
  }
  const orgsMap = await getOrgsMap(null, true);
  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Create a Legacy Reassessment</h1>
      <AssessmentForm type="legacyNewReassessment" orgsMap={orgsMap} />
    </div>
  );
};

export default Page;
