import { AssessmentForm } from "@/app/model-year-report/lib/components/AssessmentForm";
import { getReassessment } from "@/app/model-year-report/lib/data";
import { getUserInfo } from "@/auth";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const { userIsGov } = await getUserInfo();
  if (!userIsGov) {
    return null;
  }
  const args = await props.params;
  const reassessmentId = Number.parseInt(args.id, 10);
  const reassessment = await getReassessment(reassessmentId);
  if (!reassessment) {
    return null;
  }
  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Edit a Legacy Reassessment</h1>
      <AssessmentForm
        type="savedReassessment"
        reassessmentId={reassessment.id}
        orgName={reassessment.organization.name}
        modelYear={reassessment.modelYear}
      />
    </div>
  );
};

export default Page;
