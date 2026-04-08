import { getUserInfo } from "@/auth";
import { Role } from "@/prisma/generated/enums";
import { getOrgNamesAndIds } from "../data";
import { PenaltyCreditCreateForm } from "./PenaltyCreditCreateForm";

export const NewPage = async () => {
  const { userIsGov, userRoles } = await getUserInfo();
  if (!userIsGov || !userRoles.includes(Role.ZEVA_IDIR_USER)) {
    return null;
  }
  const orgNamesAndIds = await getOrgNamesAndIds();
  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">
        Submit Penalty Credits To Director
      </h1>
      <div className="bg-white rounded-lg shadow-level-1 p-6">
        <PenaltyCreditCreateForm orgNamesAndIds={orgNamesAndIds} />
      </div>
    </div>
  );
};
