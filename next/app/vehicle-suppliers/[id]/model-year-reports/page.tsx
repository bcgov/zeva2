import { getModelYearReports } from "@/app/compliance-reporting/lib/model-year-reports/data";
import { getSerializedMyrs } from "@/app/compliance-reporting/lib/model-year-reports/utilsServer";
import { ReportsTable } from "@/app/compliance-reporting/lib/model-year-reports/components/ReportsTable";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const args = await props.params;
  const orgId = Number.parseInt(args.id, 10);
  const myrs = await getModelYearReports(orgId);
  const serializedMyrs = getSerializedMyrs(myrs, true);

  return (
    <div className="space-y-6">
      <ReportsTable myrs={serializedMyrs} userIsGov={true} />
    </div>
  );
};

export default Page;
