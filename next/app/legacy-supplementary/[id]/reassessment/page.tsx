// for creating a new legacy supp reassessment
import { getUserInfo } from "@/auth";
import { AssessmentForm } from "@/app/model-year-report/lib/components/AssessmentForm";
import { getSupplementaryReport } from "@/app/model-year-report/lib/data";
import { ModelYearReportStatus } from "@/prisma/generated/enums";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const args = await props.params;
  const suppId = Number.parseInt(args.id, 10);
  const { userIsGov } = await getUserInfo();
  const supp = await getSupplementaryReport(suppId);
  if (
    !userIsGov ||
    !supp ||
    (supp.status !== ModelYearReportStatus.SUBMITTED_TO_GOVERNMENT &&
      supp.status !== ModelYearReportStatus.RETURNED_TO_ANALYST) ||
    supp.supplementaryReportReassessment
  ) {
    return null;
  }
  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">
        Create an Associated Reassessment
      </h1>
      <AssessmentForm
        type="legacyNewSuppReassessment"
        suppId={suppId}
        orgName={supp.organization.name}
        orgId={supp.organizationId}
        modelYear={supp.modelYear}
      />
    </div>
  );
};

export default Page;
