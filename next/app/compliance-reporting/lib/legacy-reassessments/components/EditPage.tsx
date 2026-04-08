import { getPresignedGetObjectUrl } from "@/app/lib/services/s3";
import { AssessmentForm } from "../../model-year-reports/components/AssessmentForm";
import { getReassessment } from "../../model-year-reports/data";
import { getUserInfo } from "@/auth";
import { ReassessmentStatus } from "@/prisma/generated/enums";

export const EditPage = async (props: { id: string }) => {
  const { userIsGov } = await getUserInfo();
  if (!userIsGov) {
    return null;
  }
  const reassessmentId = Number.parseInt(props.id, 10);
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
      <h1 className="text-xl font-bold mb-4">Edit a Legacy Reassessment</h1>
      <AssessmentForm
        type="legacySavedReassessment"
        reassessmentId={reassessmentId}
        orgName={reassessment.organization.name}
        modelYear={reassessment.modelYear}
        orgId={reassessment.organizationId}
        url={await getPresignedGetObjectUrl(reassessment.objectName)}
      />
    </div>
  );
};
