import { getUserInfo } from "@/auth";
import {
  getSupplierActionRequiredCounts,
  getSupplierAwarenessCounts,
  getSupplierInProgressCounts,
} from "../lib/services";
import { ItemsPanel } from "./ItemsPanel";
import { getActiveNotifications } from "@/app/notifications/lib/services";
import { NotificationMessageBanner } from "@/app/notifications/lib/components/NotificationMessageBanner";
import { Fragment } from "react/jsx-runtime";

// for suppliers
export const ActionCenter = async () => {
  const { userOrgId } = await getUserInfo();
  const [
    actionRequiredCounts,
    inProgressCounts,
    awarenessCounts,
    activeNotifications,
  ] = await Promise.all([
    getSupplierActionRequiredCounts(userOrgId),
    getSupplierInProgressCounts(userOrgId),
    getSupplierAwarenessCounts(userOrgId),
    getActiveNotifications(userOrgId),
  ]);
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
