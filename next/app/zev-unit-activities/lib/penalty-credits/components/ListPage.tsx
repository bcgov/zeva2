import { PenaltyCreditsList } from "./PenaltyCreditsList";
import { getUserInfo } from "@/auth";
import { Role } from "@/prisma/generated/enums";

export const ListPage = async () => {
  const { userIsGov, userRoles } = await getUserInfo();
  const canCreatePenaltyCredits =
    userIsGov && userRoles.includes(Role.ZEVA_IDIR_USER);
  return (
    <PenaltyCreditsList canCreatePenaltyCredits={canCreatePenaltyCredits} />
  );
};
