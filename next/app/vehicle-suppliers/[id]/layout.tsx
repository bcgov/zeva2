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
      label: "Supplier Information",
      route: `${Routes.VehicleSuppliers}/${id}/supplier-info`,
    },
    {
      label: "Users",
      route: `${Routes.VehicleSuppliers}/${id}/users`,
    },
    {
      label: "ZEV Models",
      route: `${Routes.VehicleSuppliers}/${id}/zev-models`,
    },
    {
      label: "Credit Transactions",
      route: `${Routes.VehicleSuppliers}/${id}/zev-unit-transactions`,
    },
    {
      label: "Model Year Reports",
      route: `${Routes.VehicleSuppliers}/${id}/model-year-reports`,
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
      <div className="flex flex-col gap-4 my-4">
        <div className="p-5 rounded-t bg-whisperGray font-bold text-2xl">
          {organization.name}
        </div>
        <hr className="border-dividerMedium"></hr>
      </div>
      {props.children}
    </>
  );
};

export default Layout;
