import { SecondaryNavbar } from "@/app/lib/components/SecondaryNavbar";
import { LowerNavbarWrapper } from "@/app/lib/components/LowerNavbarWrapper";
import { Routes } from "@/app/lib/constants";
import { getUserInfo } from "@/auth";

const Layout = async (props: { children: React.ReactNode }) => {
  const { userIsGov } = await getUserInfo();
  const items = [
    { label: "Credit Applications", route: Routes.CreditApplications },
    { label: "Credit Transfers", route: Routes.CreditTransfers },
    { label: "Credit Agreements", route: Routes.CreditAgreements },
    { label: "Penalty Credits", route: Routes.PenaltyCredits },
    ...(!userIsGov
      ? [{ label: "Credit Transactions", route: Routes.ZevUnitTransactions }]
      : []),
  ];
  const navbar = <SecondaryNavbar items={items} />;
  return (
    <div className="flex flex-col gap-6">
      <LowerNavbarWrapper type="zevUnitActivities" navbar={navbar} />
      {props.children}
    </div>
  );
};

export default Layout;
