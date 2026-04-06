import { SecondaryNavbar } from "@/app/lib/components/SecondaryNavbar";
import { Routes } from "@/app/lib/constants";
import { getUserInfo } from "@/auth";

const Layout = async (props: {
  children: React.ReactNode;
}) => {
  const { userIsGov } = await getUserInfo();
  const items = [
    {label: "Credit Agreements", route: Routes.CreditAgreements},
    {label: "Credit Applications", route: Routes.CreditApplications},
    {label: "Credit Transfers", route: Routes.CreditTransfers},
    {label: "Penalty Credits", route: Routes.PenaltyCredits},
  ];
  if (!userIsGov) {
    items.push({
        label: "ZEV Unit Transactions",
        route: Routes.ZevUnitTransactions,
    })
  }
  return (
    <>
        <SecondaryNavbar items={items}/>
        {props.children}
    </>
  )
};

export default Layout;