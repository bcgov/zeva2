import { Breadcrumbs } from "@/app/lib/components";
import { SecondaryNavbar } from "@/app/lib/components/SecondaryNavbar";
import { getVehicle } from "../../lib/data";

const Layout = async (props: {
  children: React.ReactNode;
  params: Promise<{ slug: string; id: string }>;
}) => {
  const args = await props.params;
  const id = Number.parseInt(args.id);
  const slug = args.slug;
  const vehicle = await getVehicle(id);

  if (!vehicle) {
    return null;
  }

  const items = [
    {
      label: `ZEV Model ${vehicle.modelName || id}`,
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
          { label: vehicle.modelName || `ZEV Model ${id}` },
        ]}
      />
      <SecondaryNavbar items={items} />
      {props.children}
    </>
  );
};

export default Layout;
