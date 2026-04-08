import { getUserInfo } from "@/auth";
import { fetchBalance, getComplianceYears } from "../data";
import { BalanceTable } from "./BalanceTable";
import { TransactionAccordion } from "./TransactionAccordion";

export const ListPage = async (props: { orgId?: string }) => {
  const { userIsGov, userOrgId } = await getUserInfo();
  let orgIdToUse;
  if (userIsGov && props.orgId) {
    orgIdToUse = Number.parseInt(props.orgId, 10);
  } else if (!userIsGov) {
    orgIdToUse = userOrgId;
  }
  if (!orgIdToUse) {
    return null;
  }
  const balance = await fetchBalance(orgIdToUse);
  if (balance) {
    const complianceYears = await getComplianceYears(orgIdToUse);
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
  return null;
};
