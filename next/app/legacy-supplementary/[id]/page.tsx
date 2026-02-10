import { getSupplementaryReport } from "@/app/model-year-report/lib/data";
import { Supplementary } from "@/app/model-year-report/lib/components/Supplementary";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const args = await props.params;
  const suppId = Number.parseInt(args.id, 10);
  const report = await getSupplementaryReport(suppId);
  if (!report) {
    return null;
  }
  return (
    <Supplementary
      suppId={suppId}
      orgName={report.organization.name}
      modelYear={report.modelYear}
      status={report.status}
      sequenceNumber={report.sequenceNumber}
    />
  );
};

export default Page;
