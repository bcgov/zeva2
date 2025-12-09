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
    <div className="w-full px-6 py-6 lg:px-10 xl:px-14">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">New User</h1>
      </div>
      <UserForm
        orgsMap={orgsMap}
        userOrgId={userOrgId.toString()}
        govOrgId={govOrgId.toString()}
      />
    </div>
  );
};

export default Page;