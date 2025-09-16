import { fetchBalance, getComplianceYears, getOrg } from "../lib/data";
import BalanceTable from "../lib/components/BalanceTable";
import { TransactionAccordion } from "../lib/components/TransactionAccordion";
import { getUserInfo } from "@/auth";

type Props = { params: Promise<{ id: string }> };

export default async function OrgBalancePage({ params }: Props) {
  const args = await params;
  const orgId = Number(args.id);
  const org = await getOrg(orgId);
  const balance = await fetchBalance(orgId);
  const { userIsGov } = await getUserInfo();

  if (org && balance) {
    const complianceYears = await getComplianceYears(orgId);
    return (
      <main>
        <h1>Balance for {org.name}</h1>

        {balance === "deficit" ? (
          <p style={{ color: "red" }}>Deficit</p>
        ) : (
          <BalanceTable balance={balance} />
        )}
        <TransactionAccordion
          orgId={orgId}
          userIsGov={userIsGov}
          complianceYears={complianceYears}
        />
      </main>
    );
  }
  return null;
}
