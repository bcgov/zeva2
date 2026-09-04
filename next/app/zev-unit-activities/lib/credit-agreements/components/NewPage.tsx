import { getUserInfo } from "@/auth";
import { Role } from "@/prisma/generated/enums";
import { getOrgsMap } from "@/app/lib/data/orgs";
import { AgreementForm } from "./AgreementForm";

export const NewPage = async () => {
  const { userIsGov, userRoles } = await getUserInfo();
  if (!userIsGov || !userRoles.includes(Role.ZEVA_IDIR_USER)) {
    return null;
  }
  const orgsMap = await getOrgsMap(null, true);

  return (
    <div className="p-6">
      <h1 className="mb-4 rounded-t bg-primaryBlue px-5 py-4 text-2xl font-bold text-white">
        New Credit Agreement
      </h1>
      <AgreementForm type="new" orgsMap={orgsMap} />
    </div>
  );
};
