import { LowerNavbarWrapper } from "@/app/lib/components/LowerNavbarWrapper";
import { SecondaryNavbar } from "@/app/lib/components/SecondaryNavbar";
import { zevModelTabs } from "../lib/routes";

const Layout = (props: { children: React.ReactNode }) => {
  const items = zevModelTabs.map(({ label, route }) => ({ label, route }));
  const navbar = <SecondaryNavbar items={items} />;

  return (
    <>
      <LowerNavbarWrapper type="zevModel" navbar={navbar} />
      {props.children}
    </>
  );
};

export default Layout;
