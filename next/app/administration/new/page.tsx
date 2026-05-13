import { getUserInfo } from "@/auth";
import { UserForm } from "@/app/administration/lib/components/UserForm";
import { getOrgsMap } from "@/app/lib/data/orgs";
import { getGovOrgId } from "@/app/vehicle-suppliers/lib/data";

const Page = async () => {
  const { userIsGov, userOrgId } = await getUserInfo();
  const govOrgId = await getGovOrgId();
  let orgsMap;
  if (userIsGov) {
    orgsMap = await getOrgsMap(null, false);
  }
  return (
    <div className="w-full">
      <div className="p-4 bg-gray-100 text-2xl font-bold">New User</div>
      <UserForm
        orgsMap={orgsMap}
        userOrgId={userOrgId.toString()}
        govOrgId={govOrgId.toString()}
      />
    </div>
  );
};

export default Page;
