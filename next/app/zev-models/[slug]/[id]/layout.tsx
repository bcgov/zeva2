import { Breadcrumbs } from "@/app/lib/components";
import { SecondaryNavbar } from "@/app/lib/components/SecondaryNavbar";

const Layout = async (props: {
  children: React.ReactNode;
  params: Promise<{ slug: string; id: string }>;
}) => {
  const args = await props.params;
  const id = Number.parseInt(args.id, 10);
  const slug = args.slug;

  const items = [
    {
      label: `ZEV Model ${id}`,
      route: `/zev-models/${slug}/${id}/details`,
    },
    {
      label: "Audit History",
      route: `/zev-models/${slug}/${id}/audit-history`,
    },
  ];

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "ZEV Models", href: `/zev-models/${slug}` },
          { label: "New Vehicle" },
        ]}
      />
      <SecondaryNavbar items={items} />
      {props.children}
    </>
  );
};

export default Layout;
