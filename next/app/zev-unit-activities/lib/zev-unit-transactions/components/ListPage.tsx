import { getUserInfo } from "@/auth";
import { getComplianceYears, getNestedReportableBalanceAB } from "../data";
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
  const balance = await getNestedReportableBalanceAB(orgIdToUse);
  if (balance) {
    const complianceYears = await getComplianceYears(orgIdToUse);
    return (
      <main>
        <BalanceTable balance={balance} />
        <TransactionAccordion
          orgId={orgIdToUse}
          complianceYears={complianceYears}
        />
      </main>
    );
  }
  return null;
};
