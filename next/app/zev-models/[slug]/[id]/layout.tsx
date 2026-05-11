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
      route: `/zev-models/${slug}/${id}` 
    },
    { 
      label: "Audit History", 
      route: `/zev-models/${slug}/${id}/audit-history` 
    },
  ];
  
  return (
    <>
      <SecondaryNavbar items={items} />
      {props.children}
    </>
  );
};

export default Layout;
