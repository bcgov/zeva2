import { getUserInfo } from "@/auth";
import { Role } from "@/prisma/generated/enums";
import { PenaltyCreditForm } from "./PenaltyCreditForm";
import { getOrgsMap } from "@/app/lib/data/orgs";

export const NewPage = async () => {
  const { userIsGov, userRoles } = await getUserInfo();
  if (!userIsGov || !userRoles.includes(Role.ZEVA_IDIR_USER)) {
    return null;
  }
  const orgsMap = await getOrgsMap(null, true);
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Create Penalty Credits</h1>
      <div className="bg-white rounded-lg shadow-level-1 p-6">
        <PenaltyCreditForm type="new" orgsMap={orgsMap} />
      </div>
    </div>
  );
};
