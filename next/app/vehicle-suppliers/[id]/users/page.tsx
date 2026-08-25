import { UserTable } from "@/app/gov-administration/lib/components/UserTable";
import { fetchUsers } from "@/app/administration/lib/data";
import { userIsAdmin } from "@/app/administration/lib/utilsServer";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const args = await props.params;
  const orgId = Number.parseInt(args.id, 10);
  const users = await fetchUsers(undefined, orgId);
  const isAdmin = await userIsAdmin();

  return (
    <div className="space-y-6">
      <UserTable users={users} category="supplierSpecific" isAdmin={isAdmin} />
    </div>
  );
};

export default Page;
