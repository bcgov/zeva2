import { getUserInfo } from "@/auth";
import { getUser } from "../lib/data";
import { UserForm } from "../lib/components/UserForm";
import { getGovOrgId } from "@/app/vehicle-suppliers/lib/data";
import { Breadcrumbs } from "@/app/lib/components";
import { Routes } from "@/app/lib/constants";
import { userIsAdmin } from "../lib/utilsServer";

const userLabel = (user: Awaited<ReturnType<typeof getUser>>, id: string) => {
  if (!user) {
    return `User ${id}`;
  }

  const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
  return name || user.idpUsername || `User ${id}`;
};

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const args = await props.params;
  const { userOrgId } = await getUserInfo();
  const isAdmin = await userIsAdmin();

  const id = Number.parseInt(args.id, 10);
  if (Number.isNaN(id)) {
    return null;
  }
  const user = await getUser(id);
  if (!user) {
    return null;
  }
  const govOrgId = await getGovOrgId();
  return (
    <div className="w-full">
      <Breadcrumbs
        items={[
          {
            label: "Administration",
            href: `${Routes.Administration}/supplier-info`,
          },
          {
            label: "User Management",
            href: `${Routes.Administration}/users`,
          },
          { label: userLabel(user, args.id) },
        ]}
      />
      <div className="p-4 bg-gray-100 text-2xl font-bold">User Management</div>
      <UserForm
        user={user}
        userOrgId={userOrgId.toString()}
        govOrgId={govOrgId.toString()}
        isAdmin={isAdmin}
      />
    </div>
  );
};

export default Page;
