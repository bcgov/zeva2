import { auth } from "@/auth";
import { fetchBalance } from "../lib/data";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import BalanceTable from "../lib/components/BalanceTable";
import TransactionAccordion from "../lib/components/TransactionAccordion";

type Props = { params: { id: string } };

export default async function OrgBalancePage({ params }: Props) {
  const session = await auth();
  if (!session) redirect("/api/auth/signin");

  const orgId = Number(params.id);
  if (Number.isNaN(orgId)) return <p>Invalid org ID</p>;

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { name: true },
  });
  if (!org) return <p>Organization not found</p>;

  let balance: Awaited<ReturnType<typeof fetchBalance>>;
  try {
    balance = await fetchBalance(orgId);
  } catch (e) {
    if ((e as Error).message === "Unauthorized") {
      return <p>You’re not authorized to view this organization.</p>;
    }
    throw e;
  }

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
