import { getUserInfo } from "@/auth";
import { UserForm } from "../lib/components/UserForm";
import { createUser, UserPayload } from "../lib/actions";
import { redirect } from "next/navigation";
import { Routes } from "@/app/lib/constants";
import { getOrgsMap } from "@/app/lib/data/orgs";
import { getGovOrgId } from "@/app/organizations/lib/data";

const Page = async () => {
  const { userIsGov, userOrgId } = await getUserInfo();
  const submitAction = async (data: UserPayload) => {
    "use server";
    const createdUserId = await createUser(data);
    redirect(`${Routes.Users}/${createdUserId}`);
  };
  const govOrgId = await getGovOrgId();
  let orgsMap;
  if (userIsGov) {
    orgsMap = await getOrgsMap(null, false);
  }
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">New User</h1>
      <UserForm
        orgsMap={orgsMap}
        userOrgId={userOrgId.toString()}
        govOrgId={govOrgId.toString()}
        onSubmit={submitAction}
      />
    </div>
  );
};

export default Page;
