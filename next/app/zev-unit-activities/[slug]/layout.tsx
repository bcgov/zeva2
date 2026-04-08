import { SecondaryNavbar } from "@/app/lib/components/SecondaryNavbar";
import { Routes } from "@/app/lib/constants";
import { getUserInfo } from "@/auth";

const Layout = async (props: { children: React.ReactNode }) => {
  const { userIsGov } = await getUserInfo();
  const items = [
    { label: "Credit Applications", route: Routes.CreditApplications },
    { label: "Credit Transfers", route: Routes.CreditTransfers },
    { label: "Credit Agreements", route: Routes.CreditAgreements },
    ...(userIsGov
      ? [{ label: "Penalty Credits", route: Routes.PenaltyCredits }]
      : []),
    ...(!userIsGov
      ? [{ label: "ZEV Unit Transactions", route: Routes.ZevUnitTransactions }]
      : []),
  ];
  return (
    <>
      <SecondaryNavbar items={items} />
      {props.children}
    </>
  );
};

export default Layout;
