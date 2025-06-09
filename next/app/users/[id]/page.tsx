import { getUser } from "../lib/data";
import { updateUser, deleteUser } from "../lib/actions";
import { EditUserForm } from "../lib/components/EditUserForm";
import { auth } from "@/auth";
import { Button } from "@/app/lib/components";

export default async function Page({ params }: { params: { id: string } }) {
  const session = await auth();
  const isGovernment = session?.user?.isGovernment ?? false;

  const id = parseInt(params.id, 10);
  const user = await getUser(id);

  if (!user) return <div>User not found</div>;

  const onSubmit = updateUser.bind(null, user.id, user.organizationId, "/users");
  const onDelete = deleteUser.bind(null, user.id);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">{user.organization.name} User Management</h1>
      <div className="text-sm text-gray-600">User subject identifier: {user.idpSub}</div>
      <EditUserForm user={user} onSubmit={onSubmit} isGovernment={isGovernment} />
      
      <form action={onDelete}>
        <Button type="submit">
          Delete User
        </Button>
      </form>
    </div>
  );
}
