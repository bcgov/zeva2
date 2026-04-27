import { getUserInfo } from "@/auth";
import {
  getSupplierActionRequiredCounts,
  getSupplierAwarenessCounts,
  getSupplierInProgressCounts,
} from "../lib/services";
import { ItemsPanel } from "./ItemsPanel";

export const ActionCenter = async () => {
  const { userIsGov, userOrgId, userRoles } = await getUserInfo();
  let actionRequiredCounts: Record<string, number> = {};
  let inProgressCounts: Record<string, number> = {};
  let awarenessCounts: Record<string, number> = {};
  if (userIsGov) {
    // do later
  } else {
    const [
      supplierActionRequiredCounts,
      supplierInProgressCounts,
      supplierAwarenessCounts,
    ] = await Promise.all([
      getSupplierActionRequiredCounts(userOrgId),
      getSupplierInProgressCounts(userOrgId),
      getSupplierAwarenessCounts(userOrgId),
    ]);
    actionRequiredCounts = supplierActionRequiredCounts;
    inProgressCounts = supplierInProgressCounts;
    awarenessCounts = supplierAwarenessCounts;
  }
  return (
    <div className="flex flex-col gap-2 w-full border border-dividerMedium/40 p-2">
      <h1 className="text-lg font-bold">Action Center</h1>
      <ItemsPanel
        title="Requires Your Action"
        countsMap={actionRequiredCounts}
      />
      <ItemsPanel title="In Progress" countsMap={inProgressCounts} />
      <ItemsPanel title="For Awareness" countsMap={awarenessCounts} />
    </div>
  );
};
