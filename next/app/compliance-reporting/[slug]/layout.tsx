// populate secondary navbar and wrap around children

import { SecondaryNavbar } from "@/app/lib/components/SecondaryNavbar";
import { Routes } from "@/app/lib/constants";
import { getUserInfo } from "@/auth";

const Layout = async (props: { children: React.ReactNode }) => {
  const { userIsGov } = await getUserInfo();
  const items = [
    { label: "Model Year Reports", route: Routes.ModelYearReports },
    { label: "Compliance Ratios", route: Routes.ComplianceRatios },
    ...(!userIsGov
      ? [{ label: "Compliance Calculator", route: Routes.ComplianceCalculator }]
      : []),
    { label: "Legacy Reassessments", route: Routes.LegacyReassessments },
    {
      label: "Legacy Supplementary Reports",
      route: Routes.LegacySupplementary,
    },
  ];
  return (
    <>
      <SecondaryNavbar items={items} />
      {props.children}
    </>
  );
};

export default Layout;
