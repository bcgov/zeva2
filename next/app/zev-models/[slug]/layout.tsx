import { SecondaryNavbar } from "@/app/lib/components/SecondaryNavbar";
import { Routes } from "@/app/lib/constants";

const Layout = async (props: { children: React.ReactNode }) => {
  const items = [
    { label: "Active", route: Routes.ActiveZevModels },
    { label: "Inactive", route: Routes.InactiveZevModels },
  ];
  return (
    <>
      <SecondaryNavbar items={items} />
      {props.children}
    </>
  );
};

export default Layout;
