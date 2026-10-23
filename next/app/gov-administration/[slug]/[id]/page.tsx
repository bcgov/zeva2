import { getUserInfo } from "@/auth";
import { getUser } from "@/app/administration/lib/data";
import { UserForm } from "@/app/administration/lib/components/UserForm";
import { getGovOrgId } from "@/app/vehicle-suppliers/lib/data";
import { userIsAdmin } from "@/app/administration/lib/utilsServer";
import { Breadcrumbs } from "@/app/lib/components";
import { Routes } from "@/app/lib/constants";
import { categoryLabels } from "../../lib/constants";

const Page = async (props: {
  params: Promise<{ slug: string; id: string }>;
}) => {
  const { userOrgId } = await getUserInfo();
  const isAdmin = await userIsAdmin();
  const args = await props.params;
  const id = Number.parseInt(args.id, 10);
  const slug = args.slug;
  const user = await getUser(id);
  if (!user) {
    return null;
  }
  const govOrgId = await getGovOrgId();
  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs
        items={[
          { label: "Administration", href: `${Routes.GovAdministration}/idir` },
          {
            label: categoryLabels[slug] ?? slug,
            href: `${Routes.GovAdministration}/${slug}`,
          },
          { label: `${user.firstName} ${user.lastName}` },
        ]}
      />
      <div className="p-4 bg-gray-100 text-2xl font-bold">
        Government User Management
      </div>
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
