import { LowerNavbarWrapper } from "@/app/lib/components/LowerNavbarWrapper";
import { SecondaryNavbar } from "@/app/lib/components/SecondaryNavbar";
import { Routes } from "@/app/lib/constants";

const Layout = (props: { children: React.ReactNode }) => {
  const items = [
    { label: "Active", route: Routes.ActiveZevModels },
    { label: "Inactive", route: Routes.InactiveZevModels },
  ];
  const navbar = <SecondaryNavbar items={items} />;

  return (
    <>
      <LowerNavbarWrapper type="zevModel" navbar={navbar} />
      {props.children}
    </>
  );
};

export default Layout;
