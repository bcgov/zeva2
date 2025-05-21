import { fetchBalance, getOrg } from "../lib/data";
import BalanceTable from "../lib/components/BalanceTable";
import TransactionAccordion from "../lib/components/TransactionAccordion";

type Props = { params: Promise<{ id: string }> };

export default async function OrgBalancePage({ params }: Props) {
  const args = await params;
  const orgId = Number(args.id);
  const org = await getOrg(orgId);
  const balance = await fetchBalance(orgId);

  if (org && balance) {
    return (
      <main>
        <h1>Balance for {org.name}</h1>

        {balance === "deficit" ? (
          <p style={{ color: "red" }}>Deficit</p>
        ) : (
          <BalanceTable balance={balance} />
        )}
        <TransactionAccordion orgId={orgId} />
      </main>
    );
  }
  return null;
}
