import { SecondaryNavbar } from "@/app/lib/components/SecondaryNavbar";
import { Routes } from "@/app/lib/constants";

const Layout = async (props: { children: React.ReactNode }) => {
  const items = [
    { label: "IDIR", route: `${Routes.GovAdministration}/idir` },
    { label: "BCeID", route: `${Routes.GovAdministration}/bceid` },
    { label: "Inactive", route: `${Routes.GovAdministration}/inactive` },
  ];
  return (
    <div className="flex flex-col gap-6">
      <SecondaryNavbar items={items} />
      {props.children}
    </div>
  );
};

export default Layout;
