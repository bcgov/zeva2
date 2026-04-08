// for gov users: slug should be idir, bceid, or inactive; return children wrapped inside secondary navbar
// for supplier users: slug should be an id; in this case, return children; no wrapping

import { SecondaryNavbar } from "@/app/lib/components/SecondaryNavbar";
import { Routes } from "@/app/lib/constants";
import { getUserInfo } from "@/auth";

const Layout = async (props: { children: React.ReactNode }) => {
  const { userIsGov } = await getUserInfo();
  if (userIsGov) {
    const items = [
      { label: "IDIR", route: `${Routes.Administration}/idir` },
      { label: "BCeID", route: `${Routes.Administration}/bceid` },
      { label: "Inactive", route: `${Routes.Administration}/inactive` },
    ];
    return (
      <>
        <SecondaryNavbar items={items} />
        {props.children}
      </>
    );
  } else {
    return <>{props.children}</>;
  }
};

export default Layout;
