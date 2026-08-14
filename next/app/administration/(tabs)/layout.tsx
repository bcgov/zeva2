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
    <>
      <SecondaryNavbar items={items} />
      <div className="p-6">{props.children}</div>
    </>
  );
};

export default Layout;
