import { ReassessmentsAndSupplementaryReports } from "@/app/compliance-reporting/lib/model-year-reports/components/ReassessmentsAndSupplementaryReports";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const args = await props.params;
  const myrId = parseInt(args.id, 10);

  // need "create supp action for supplier, create reassessment action for gov analyst"

  return (
    <div className="flex-flex-col gap-2">
      <ReassessmentsAndSupplementaryReports myrId={myrId} />
    </div>
  );
};

export default Page;
