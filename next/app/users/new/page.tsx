import { getUserInfo } from "@/auth";
import { NewUserForm } from "../lib/components/NewUserForm";

export default async function Page() {
  const { userIsGov, userOrgId } = await getUserInfo();

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">New User</h1>
      <NewUserForm organizationId={userOrgId} isGovernment={userIsGov} />
    </div>
  );
}
