import { getUserInfo } from "@/auth";
import { fetchBalance } from "./lib/data";
import BalanceTable from "./lib/components/BalanceTable";
import TransactionAccordion from "./lib/components/TransactionAccordion";

export default async function BalancePage() {
  const { userIsGov, userOrgId } = await getUserInfo();
  if (!userIsGov) {
    const balance = await fetchBalance(userOrgId);
    if (balance) {
      return (
        <main>
          <h1>Current Balance</h1>

          {balance === "deficit" ? (
            <p style={{ color: "red" }}>Deficit</p>
          ) : (
            <BalanceTable balance={balance} />
          )}
          <TransactionAccordion orgId={userOrgId} />
        </main>
      );
    }
  }
  return null;
}
