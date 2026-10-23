import { fetchUsers } from "@/app/administration/lib/data";
import { UserTable } from "../lib/components/UserTable";
import { userIsAdmin } from "@/app/administration/lib/utilsServer";
import { SecondaryNavbar } from "@/app/lib/components/SecondaryNavbar";
import { Routes } from "@/app/lib/constants";

const Page = async (props: { params: Promise<{ slug: string }> }) => {
  const args = await props.params;
  const slug = args.slug;
  const isAdmin = await userIsAdmin();
  if (slug === "idir" || slug === "bceid" || slug === "inactive") {
    const users = await fetchUsers(slug);
    const items = [
      { label: "IDIR", route: `${Routes.GovAdministration}/idir` },
      { label: "BCeID", route: `${Routes.GovAdministration}/bceid` },
      { label: "Inactive", route: `${Routes.GovAdministration}/inactive` },
    ];
    return (
      <div className="flex flex-col gap-6">
        <SecondaryNavbar items={items} />
        <UserTable users={users} category={slug} isAdmin={isAdmin} />
      </div>
    );
  }
  return null;
};

export default Page;
