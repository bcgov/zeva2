import { getData } from "../data";
import { AnalystActions } from "./AnalystActions";
import { sumCredits } from "../utils";
import { ApplicationCredits } from "./ApplicationCredits";
import { CreditApplicationStatus } from "@/prisma/generated/client";

export const AnalystView = async (props: {
  id: number;
  status: CreditApplicationStatus;
}) => {
  const data = await getData(props.id);
  const validatedBefore = data.numberOfRecords > 0;
  const summedCredits = sumCredits(data.credits);
  return (
    <>
      <ApplicationCredits credits={summedCredits} />
      <AnalystActions
        id={props.id}
        status={props.status}
        validatedBefore={validatedBefore}
      />
    </>
  );
};
