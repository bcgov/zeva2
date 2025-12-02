import { Reassessment } from "@/app/model-year-report/lib/components/Reassessment";
import { getReassessment } from "@/app/model-year-report/lib/data";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const args = await props.params;
  const reassessmentId = Number.parseInt(args.id, 10);
  const reassessment = await getReassessment(reassessmentId);
  if (!reassessment) {
    return null;
  }
  return (
    <Reassessment
      reassessmentId={reassessment.id}
      status={reassessment.status}
    />
  );
};

export default Page;
