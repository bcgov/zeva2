"use client";

import { NotificationMessageBanner } from "@/app/notifications/lib/components/NotificationMessageBanner";
import { ActiveNotificationForSupplier } from "@/app/notifications/lib/constants";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";

export const ActiveNotificationsDisplay = (props: {
  notifications: ActiveNotificationForSupplier[];
}) => {
  const [displayedNotifications, setDisplayedNotifications] = useState<
    ActiveNotificationForSupplier[]
  >([]);

  useEffect(() => {
    if (props.notifications.length > 0) {
      setDisplayedNotifications([props.notifications[0]]);
    }
  }, [props.notifications]);

  const toExpandOrToCollapse = useMemo(() => {
    const notificationsLength = props.notifications.length;
    if (notificationsLength > 1) {
      if (notificationsLength === displayedNotifications.length) {
        return "toCollapse";
      }
      return "toExpand";
    }
    return null;
  }, [props.notifications, displayedNotifications]);

  const handleExpand = useCallback(() => {
    setDisplayedNotifications(props.notifications);
  }, [props.notifications]);

  const handleCollapse = useCallback(() => {
    setDisplayedNotifications([props.notifications[0]]);
  }, [props.notifications]);

  if (props.notifications.length === 0) {
    return null;
  }
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row justify-between items-center">
        <h2 className="text-xl font-bold">
          Notifications ({props.notifications.length})
        </h2>
        {toExpandOrToCollapse === "toCollapse" && (
          <span
            onClick={handleCollapse}
            className="text-link underline cursor-pointer"
          >
            Collapse All Notifications
          </span>
        )}
        {toExpandOrToCollapse === "toExpand" && (
          <span
            onClick={handleExpand}
            className="text-link underline cursor-pointer"
          >
            View All Notifications
          </span>
        )}
      </div>
      {displayedNotifications.map((notification, index) => {
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
  );
};
