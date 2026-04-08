// for editing a non-legacy supplementary reassessment
import { getUserInfo } from "@/auth";
import { AssessmentForm } from "@/app/compliance-reporting/lib/model-year-reports/components/AssessmentForm";
import { getSupplementaryReport } from "@/app/compliance-reporting/lib/model-year-reports/data";
import { ModelYearReportStatus } from "@/prisma/generated/enums";
import { getPresignedGetObjectUrl } from "@/app/lib/services/s3";

const Page = async (props: {
  params: Promise<{ id: string; supplementaryId: string }>;
}) => {
  const args = await props.params;
  const myrId = Number.parseInt(args.id, 10);
  const suppId = Number.parseInt(args.supplementaryId, 10);
  const { userIsGov } = await getUserInfo();
  const supp = await getSupplementaryReport(suppId);
  if (
    !userIsGov ||
    !supp ||
    (supp.status !== ModelYearReportStatus.SUBMITTED_TO_GOVERNMENT &&
      supp.status !== ModelYearReportStatus.RETURNED_TO_ANALYST) ||
    !supp.supplementaryReportReassessment
  ) {
    return null;
  }
  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">
        Edit an Associated Reassessment
      </h1>
      <AssessmentForm
        type="nonLegacySavedSuppReassessment"
        suppId={suppId}
        orgName={supp.organization.name}
        orgId={supp.organizationId}
        myrId={myrId}
        modelYear={supp.modelYear}
        url={await getPresignedGetObjectUrl(
          supp.supplementaryReportReassessment.objectName,
        )}
      />
    </div>
  );
};

export default Page;
