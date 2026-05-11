"use client";

import { SecondaryNavbar } from "@/app/lib/components/SecondaryNavbar";
import { Routes } from "@/app/lib/constants";
import { usePathname } from "next/navigation";

const Layout = (props: { children: React.ReactNode }) => {
  const pathname = usePathname();
  
  const isListView = pathname === "/zev-models/active" || pathname === "/zev-models/inactive";
  
  const items = [
    { label: "Active", route: Routes.ActiveZevModels },
    { label: "Inactive", route: Routes.InactiveZevModels },
  ];
  
  return (
    <>
      {isListView && <SecondaryNavbar items={items} />}
      {props.children}
    </>
  );
};

export default Layout;
