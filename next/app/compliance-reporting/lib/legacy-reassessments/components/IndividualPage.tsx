import { Reassessment } from "../../model-year-reports/components/Reassessment";
import { getReassessment } from "../../model-year-reports/data";

export const IndividualPage = async (props: { id: string }) => {
  const reassessmentId = Number.parseInt(props.id, 10);
  const reassessment = await getReassessment(reassessmentId);
  if (!reassessment) {
    return null;
  }
  return (
    <Reassessment
      reassessmentId={reassessment.id}
      orgName={reassessment.organization.name}
      modelYear={reassessment.modelYear}
      status={reassessment.status}
    />
  );
};
