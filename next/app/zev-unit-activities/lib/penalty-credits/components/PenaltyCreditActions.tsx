import { getUserInfo } from "@/auth";
import { PenaltyCreditStatus, Role } from "@/prisma/generated/enums";
import { getPenaltyCredit } from "../data";
import { PenaltyCreditActionsClient } from "./PenaltyCreditActionsClient";

export const PenaltyCreditActions = async (props: {
  penaltyCreditId: number;
}) => {
  const { userIsGov, userRoles } = await getUserInfo();
  if (!userIsGov || !userRoles.includes(Role.DIRECTOR)) {
    return null;
  }
  const penaltyCredit = await getPenaltyCredit(props.penaltyCreditId);
  if (
    !penaltyCredit ||
    penaltyCredit.status !== PenaltyCreditStatus.SUBMITTED_TO_DIRECTOR
  ) {
    return null;
  }
  return <PenaltyCreditActionsClient penaltyCreditId={props.penaltyCreditId} />;
};
