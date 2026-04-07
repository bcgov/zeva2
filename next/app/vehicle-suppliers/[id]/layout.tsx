import { SecondaryNavbar } from "@/app/lib/components/SecondaryNavbar";
import { Routes } from "@/app/lib/constants";
import { getUserInfo } from "@/auth";

const Layout = async (props: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) => {
  const { userIsGov } = await getUserInfo();
  if (!userIsGov) {
    return null;
  }
  const { id } = await props.params;
  const items = [
    {
      label: "Supplier Info",
      route: `${Routes.VehicleSuppliers}/${id}/supplier-info`,
    },
    {
      label: "Credit Transfers",
      route: `${Routes.VehicleSuppliers}/${id}/zev-unit-transactions`,
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
