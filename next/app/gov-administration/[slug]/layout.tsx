import { SecondaryNavbar } from "@/app/lib/components/SecondaryNavbar";
import { Routes } from "@/app/lib/constants";

const Layout = async (props: { children: React.ReactNode }) => {
  const items = [
    { label: "IDIR", route: `${Routes.GovAdministration}/idir` },
    { label: "BCeID", route: `${Routes.GovAdministration}/bceid` },
    { label: "Inactive", route: `${Routes.GovAdministration}/inactive` },
  ];
  return (
    <>
      <SecondaryNavbar items={items} />
      {props.children}
    </>
  );
};

export default Layout;
