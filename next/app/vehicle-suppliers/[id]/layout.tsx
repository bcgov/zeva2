import { Breadcrumbs } from "@/app/lib/components";
import { SecondaryNavbar } from "@/app/lib/components/SecondaryNavbar";
import { Routes } from "@/app/lib/constants";
import { getOrganizationDetails } from "../lib/services";
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
  const orgId = Number.parseInt(id, 10);
  const organization = await getOrganizationDetails(orgId);

  if (!organization) {
    return null;
  }

  const items = [
    {
      label: "Supplier Info",
      route: `${Routes.VehicleSuppliers}/${id}/supplier-info`,
    },
    {
      label: "ZEV Unit Transactions",
      route: `${Routes.VehicleSuppliers}/${id}/zev-unit-transactions`,
    },
  ];
  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Vehicle Suppliers", href: Routes.VehicleSuppliers },
          { label: organization.name || `Supplier ${id}` },
        ]}
      />
      <SecondaryNavbar items={items} />
      {props.children}
    </>
  );
};

export default Layout;
