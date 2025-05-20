import { auth } from "@/auth";
import { fetchBalance } from "./lib/data";
import { ModelYear } from "@/prisma/generated/client";
import BalanceTable from "./lib/components/BalanceTable";
import TransactionAccordion from "./lib/components/TransactionAccordion";

export default async function BalancePage() {
  const session = await auth();
  const orgId = session?.user?.organizationId || 0;
  const currentYear = 2025
  const yearEnum = ("MY_" + currentYear) as ModelYear;

  const balance = await fetchBalance(orgId);

  return (
    <main>
      <h1>Balance ({currentYear})</h1>

      {balance === "deficit" ? (
      <p style={{ color: "red" }}>Deficit</p>
      ) : (
        <BalanceTable balance={balance} />
      )}
      <TransactionAccordion orgId={orgId} />
    </main>
  );
}
