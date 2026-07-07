// for editing the supp reassessment associated with a legacy supplementary

import { AssessmentForm } from "@/app/compliance-reporting/lib/model-year-reports/components/AssessmentForm";
import { getSupplementaryReport } from "@/app/compliance-reporting/lib/model-year-reports/data";
import { getPresignedGetObjectUrl } from "@/app/lib/services/s3";
import { getUserInfo } from "@/auth";
import { ModelYearReportStatus, Role } from "@/prisma/generated/enums";

const Page = async (props: {
  params: Promise<{ slug: string; id: string }>;
}) => {
  const args = await props.params;
  const slug = args.slug;
  const suppId = Number.parseInt(args.id, 10);
  if (slug !== "legacy-supplementaries") {
    return null;
  }
  const { userIsGov, userRoles } = await getUserInfo();
  if (!userIsGov || !userRoles.includes(Role.ZEVA_IDIR_USER)) {
    return null;
  }
  const supp = await getSupplementaryReport(suppId);
  if (
    !supp ||
    !supp.supplementaryReportReassessment ||
    (supp.status !== ModelYearReportStatus.RETURNED_TO_ANALYST &&
      supp.status !== ModelYearReportStatus.SUBMITTED_TO_GOVERNMENT)
  ) {
    return null;
  }
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Create a Reassessment</h1>
      <AssessmentForm
        type="legacySavedSuppReassessment"
        suppId={suppId}
        orgName={supp.organization.name}
        modelYear={supp.modelYear}
        orgId={supp.organizationId}
        url={await getPresignedGetObjectUrl(
          supp.supplementaryReportReassessment.objectName,
        )}
      />
    </div>
  );
};

export default Page;
