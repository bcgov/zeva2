import { SecondaryNavbar } from "@/app/lib/components/SecondaryNavbar";
import { Routes } from "@/app/lib/constants";

const Layout = async (props: { children: React.ReactNode }) => {
  const items = [
    {
      label: "Supplier Information",
      route: `${Routes.Administration}/supplier-info`,
    },
    {
      label: "Users",
      route: `${Routes.Administration}/users`,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <SecondaryNavbar items={items} />
      {props.children}
    </div>
  );
};

export default Layout;
