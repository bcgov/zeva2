import { getUser } from "../lib/data";
import { updateUser } from "../lib/actions";
import { EditUserForm } from "../lib/components/EditUserForm";
import { getUserInfo } from "@/auth";
import { redirect } from "next/navigation";

export default async function Page({ params }: { params: { id: string } }) {
  const { userIsGov, userOrgId } = await getUserInfo();

  const id = parseInt(params.id, 10);
  const user = await getUser(id);

  if (!user) return <div>User not found</div>;

  async function handleSubmit(updated) {
    "use server";
    await updateUser(id, userOrgId, "/users", updated);
    redirect("/users");
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{user.organization.name} User Management</h1>
      <div className="mb-4 text-sm text-gray-600">User subject identifier: {user.idpSub}</div>
      <EditUserForm user={user} onSubmit={handleSubmit} isGovernment={userIsGov} />
    </div>
  );
}
