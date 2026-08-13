import { Breadcrumbs } from "@/app/lib/components";
import { Routes } from "@/app/lib/constants";
import { getUser } from "@/app/administration/lib/data";

const categoryLabels: Record<string, string> = {
  bceid: "BCeID",
  idir: "IDIR",
  inactive: "Inactive",
};

const userLabel = (user: Awaited<ReturnType<typeof getUser>>, id: string) => {
  if (!user) {
    return `User ${id}`;
  }

  const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
  return name || user.idpUsername || `User ${id}`;
};

const Layout = async (props: {
  children: React.ReactNode;
  params: Promise<{ slug: string; id: string }>;
}) => {
  const { slug, id } = await props.params;
  const user = await getUser(Number.parseInt(id, 10));
  const categoryLabel = categoryLabels[slug] ?? slug;

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Administration", href: `${Routes.GovAdministration}/idir` },
          { label: categoryLabel, href: `${Routes.GovAdministration}/${slug}` },
          { label: userLabel(user, id) },
        ]}
      />
      {props.children}
    </>
  );
};

export default Layout;
