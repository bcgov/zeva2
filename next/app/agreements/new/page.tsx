import { getUserInfo } from "@/auth";
import { Role } from "@/prisma/generated/enums";
import { getOrgsMap } from "@/app/lib/data/orgs";
import { AgreementForm } from "../lib/components/AgreementForm";

const Page = async () => {
  const { userIsGov, userRoles } = await getUserInfo();
  if (!userIsGov || !userRoles.includes(Role.ZEVA_IDIR_USER)) {
    return null;
  }
  const orgsMap = await getOrgsMap(null, true);

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-primaryBlue pb-4">
        Create an Agreement
      </h2>
      <div className="bg-white rounded-lg shadow-level-1 p-6">
        <AgreementForm type="new" orgsMap={orgsMap} />
      </div>
    </div>
  );
};

export default Page;
