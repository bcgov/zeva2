import { getUserInfo } from "@/auth";
import { getComplianceYears, getNestedReportableBalanceAB } from "../data";
import { BalanceTable } from "./BalanceTable";
import { TransactionTable } from "./TransactionTable";

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
  const balance = await getNestedReportableBalanceAB(orgIdToUse);
  if (balance) {
    const complianceYears = await getComplianceYears(orgIdToUse);
    return (
      <main className="space-y-6">
        {balance === "deficit" ? (
          <p style={{ color: "red" }}>Deficit</p>
        ) : (
          <BalanceTable balance={balance} />
        )}
        <TransactionTable
          orgId={orgIdToUse}
          complianceYears={complianceYears}
        />
      </main>
    );
  }
  return null;
};
