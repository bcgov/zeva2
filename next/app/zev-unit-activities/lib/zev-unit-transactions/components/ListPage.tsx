import { getUserInfo } from "@/auth";
import { fetchBalance, getComplianceYears } from "../data";
import { BalanceTable } from "./BalanceTable";
import { TransactionAccordion } from "./TransactionAccordion";

export const ListPage = async () => {
  const { userIsGov, userOrgId } = await getUserInfo();
  if (!userIsGov) {
    const balance = await fetchBalance(userOrgId);
    if (balance) {
      const complianceYears = await getComplianceYears(userOrgId);
      return (
        <main>
          <h1>Current Balance</h1>

          {balance === "deficit" ? (
            <p style={{ color: "red" }}>Deficit</p>
          ) : (
            <BalanceTable balance={balance} />
          )}
          <TransactionAccordion
            orgId={userOrgId}
            userIsGov={userIsGov}
            complianceYears={complianceYears}
          />
        </main>
      );
    }
  }
  return null;
}
