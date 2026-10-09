import { getIsoYmdString } from "@/app/lib/utils/date";
import {
  NotificationObject,
  NotificationPayload,
  PayloadValidation,
  SerializedNotificationFull,
  SerializedNotificationSparse,
} from "./constants";
import { getNotificationPayload } from "./utils";

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

export const validatePayload = (
  payload: NotificationPayload,
): PayloadValidation => {
  try {
    return { success: true, payload: getNotificationPayload(payload) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Invalid notification!",
    };
  }
};
