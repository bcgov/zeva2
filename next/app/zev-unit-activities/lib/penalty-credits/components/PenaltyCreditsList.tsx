import { getPenaltyCredits } from "../data";
import { PenaltyCreditsTable } from "./PenaltyCreditsTable";

export const PenaltyCreditsList = async (props: {
  canCreatePenaltyCredits: boolean;
}) => {
  const credits = await getPenaltyCredits();
  return (
    <PenaltyCreditsTable
      credits={credits}
      canCreatePenaltyCredits={props.canCreatePenaltyCredits}
    />
  );
};
