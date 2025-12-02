import { getUserInfo } from "@/auth";
import { UserForm } from "../lib/components/UserForm";
import { getOrgsMap } from "@/app/lib/data/orgs";
import { getGovOrgId } from "@/app/organizations/lib/data";

const Page = async () => {
  const { userIsGov, userOrgId } = await getUserInfo();
  const govOrgId = await getGovOrgId();
  let orgsMap;
  if (userIsGov) {
    orgsMap = await getOrgsMap(null, false);
  }
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">New User</h1>
      <div className="bg-white rounded-lg shadow-level-1 p-6">
        <UserForm
          orgsMap={orgsMap}
          userOrgId={userOrgId.toString()}
          govOrgId={govOrgId.toString()}
        />
      </div>
    </div>
  );
};

export default Page;
