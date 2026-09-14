import { getIsoYmdString } from "@/app/lib/utils/date";
import {
  NotificationObject,
  SerializedNotificationFull,
  SerializedNotificationSparse,
} from "./constants";

export const serializeNotificationSparse = (
  notification: NotificationObject,
): SerializedNotificationSparse => {
  return {
    id: notification.id,
    owner: `${notification.user.firstName} ${notification.user.lastName}`,
    ownerId: notification.userId,
    status: notification.status,
    type: notification.type,
    audience: notification.inAppNotificationOrganizations.map((item) => {
      return item.organization.name;
    }),
    startDate: getIsoYmdString(notification.startTimestamp),
    endDate: getIsoYmdString(notification.endTimestamp),
    allSuppliers: notification.allSuppliers,
  };
};

export const serializeNotificationFull = (
  notification: NotificationObject,
): SerializedNotificationFull => {
  const serializedNotificationSparse =
    serializeNotificationSparse(notification);
  return {
    ...serializedNotificationSparse,
    title: notification.title,
    message: notification.message,
    audienceIds: notification.inAppNotificationOrganizations.map((item) => {
      return item.organization.id;
    }),
  };
};
