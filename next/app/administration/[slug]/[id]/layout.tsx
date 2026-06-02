import { Breadcrumbs } from "@/app/lib/components";
import { Routes } from "@/app/lib/constants";
import { getUserInfo } from "@/auth";
import { getUser } from "../../lib/data";

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
  const { userIsGov } = await getUserInfo();
  const { slug, id } = await props.params;

  if (!userIsGov) {
    return props.children;
  }

  const user = await getUser(Number.parseInt(id, 10));
  const categoryLabel = categoryLabels[slug] ?? slug;

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Administration", href: `${Routes.Administration}/idir` },
          { label: categoryLabel, href: `${Routes.Administration}/${slug}` },
          { label: userLabel(user, id) },
        ]}
      />
      {props.children}
    </>
  );
};

export default Layout;
