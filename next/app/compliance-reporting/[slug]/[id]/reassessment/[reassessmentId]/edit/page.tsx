import { getPresignedGetObjectUrl } from "@/app/lib/services/s3";
import { AssessmentForm } from "@/app/model-year-report/lib/components/AssessmentForm";
import { getReassessment } from "@/app/model-year-report/lib/data";
import { getUserInfo } from "@/auth";
import { ReassessmentStatus } from "@/prisma/generated/enums";

const Page = async (props: {
  params: Promise<{ id: string; reassessmentId: string }>;
}) => {
  const { userIsGov } = await getUserInfo();
  if (!userIsGov) {
    return null;
  }
  const args = await props.params;
  const myrId = Number.parseInt(args.id, 10);
  const reassessmentId = Number.parseInt(args.reassessmentId, 10);
  const reassessment = await getReassessment(reassessmentId);
  if (
    !reassessment ||
    (reassessment.status !== ReassessmentStatus.DRAFT &&
      reassessment.status !== ReassessmentStatus.RETURNED_TO_ANALYST)
  ) {
    return null;
  }
  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Edit a Reassessment</h1>
      <AssessmentForm
        type="nonLegacySavedReassessment"
        reassessmentId={reassessment.id}
        orgName={reassessment.organization.name}
        modelYear={reassessment.modelYear}
        orgId={reassessment.organizationId}
        myrId={myrId}
        url={await getPresignedGetObjectUrl(reassessment.objectName)}
      />
    </div>
  );
};

export default Page;
