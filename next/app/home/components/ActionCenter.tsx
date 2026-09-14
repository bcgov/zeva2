import { getUserInfo } from "@/auth";
import {
  getSupplierActionRequiredCounts,
  getSupplierAwarenessCounts,
  getSupplierInProgressCounts,
} from "../lib/services";
import { ItemsPanel } from "./ItemsPanel";
import { getActiveNotifications } from "@/app/notifications/lib/services";
import { ActiveNotificationForSupplier } from "@/app/notifications/lib/constants";
import { NotificationMessageBanner } from "@/app/notifications/lib/components/NotificationMessageBanner";
import { Fragment } from "react/jsx-runtime";

export const ActionCenter = async () => {
  const { userIsGov, userOrgId } = await getUserInfo();
  let actionRequiredCounts: Record<string, number> = {};
  let inProgressCounts: Record<string, number> = {};
  let awarenessCounts: Record<string, number> = {};
  let activeNotifications: ActiveNotificationForSupplier[] = [];
  if (userIsGov) {
    // do later
  } else {
    const [
      supplierActionRequiredCounts,
      supplierInProgressCounts,
      supplierAwarenessCounts,
      notifications,
    ] = await Promise.all([
      getSupplierActionRequiredCounts(userOrgId),
      getSupplierInProgressCounts(userOrgId),
      getSupplierAwarenessCounts(userOrgId),
      getActiveNotifications(userOrgId),
    ]);
    actionRequiredCounts = supplierActionRequiredCounts;
    inProgressCounts = supplierInProgressCounts;
    awarenessCounts = supplierAwarenessCounts;
    activeNotifications = notifications;
  }
  return (
    <div className="flex flex-col gap-6">
      {activeNotifications.length > 0 && (
        <div className="flex flex-col gap-4 border border-dividerMedium/40 p-4">
          <h1 className="text-lg font-bold">Notifications</h1>
          {activeNotifications.map((notification, index) => {
            return (
              <Fragment key={index}>
                <NotificationMessageBanner
                  type={notification.type}
                  title={notification.title}
                  message={notification.message}
                />
              </Fragment>
            );
          })}
        </div>
      )}
      <div className="flex flex-col gap-4 border border-dividerMedium/40 p-4">
        <h1 className="text-lg font-bold">Action Center</h1>
        <ItemsPanel
          title="Requires Your Action"
          countsMap={actionRequiredCounts}
        />
        <ItemsPanel title="In Progress" countsMap={inProgressCounts} />
        <ItemsPanel title="For Awareness" countsMap={awarenessCounts} />
      </div>
    </div>
  );
};
