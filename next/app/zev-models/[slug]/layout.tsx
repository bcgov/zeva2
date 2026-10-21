import { LowerNavbarWrapper } from "@/app/lib/components/LowerNavbarWrapper";
import { SecondaryNavbar } from "@/app/lib/components/SecondaryNavbar";
import { zevModelTabs } from "../lib/constants";

const Layout = (props: { children: React.ReactNode }) => {
  const items = zevModelTabs.map(({ label, route }) => ({ label, route }));
  const navbar = <SecondaryNavbar items={items} />;

  return (
    <div className="flex flex-col gap-6">
      <LowerNavbarWrapper type="zevModel" navbar={navbar} />
      {props.children}
    </div>
  );
};

export default Layout;
