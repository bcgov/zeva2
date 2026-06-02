import { getUserInfo } from "@/auth";
import { AgreementList } from "./AgreementList";
import { Role } from "@/prisma/generated/enums";

export const ListPage = async () => {
  const { userIsGov, userRoles } = await getUserInfo();
  const canCreateAgreement =
    userIsGov && userRoles.includes(Role.ZEVA_IDIR_USER);
  return (
    <AgreementList
      userIsGov={userIsGov}
      canCreateAgreement={canCreateAgreement}
    />
  );
};
