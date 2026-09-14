"use server";

import {
  DataOrErrorActionResponse,
  ErrorOrSuccessActionResponse,
  getDataActionResponse,
  getErrorActionResponse,
  getSuccessActionResponse,
} from "@/app/lib/utils/actionResponse";
import { validateDate } from "@/app/lib/utils/date";
import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import { InAppNotificationStatus, Role } from "@/prisma/generated/enums";
import { NotificationPayload } from "./constants";

export const createNotification = async (
  payload: NotificationPayload,
): Promise<DataOrErrorActionResponse<number>> => {
  payload.type;
  const { userIsGov, userId, userRoles } = await getUserInfo();
  if (!userIsGov || !userRoles.includes(Role.ZEVA_IDIR_USER)) {
    return getErrorActionResponse("Unauthorized!");
  }
  const [startDateIsValid, startTimestamp] = validateDate(payload.startDate);
  const [endDateIsValid, endTimestamp] = validateDate(payload.endDate);
  if (!startDateIsValid || !endDateIsValid) {
    return getErrorActionResponse("Invalid Date!");
  }
  let notificationId = NaN;
  await prisma.$transaction(async (tx) => {
    const { id: createdNotificationId } = await tx.inAppNotification.create({
      data: {
        userId,
        status: InAppNotificationStatus.DRAFT,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        startTimestamp,
        endTimestamp,
        allSuppliers: payload.allSuppliers,
      },
    });
    notificationId = createdNotificationId;
    if (!payload.allSuppliers) {
      await tx.inAppNotificationOrganization.createMany({
        data: payload.audienceIds.map((supplierId) => {
          return {
            inAppNotificationId: notificationId,
            organizationId: supplierId,
          };
        }),
      });
    }
  });
  return getDataActionResponse(notificationId);
};

export const updateNotification = async (
  notificationId: number,
  payload: NotificationPayload,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userId } = await getUserInfo();
  const notification = await prisma.inAppNotification.findUnique({
    where: {
      id: notificationId,
      status: InAppNotificationStatus.DRAFT,
      userId,
    },
  });
  if (!notification) {
    return getErrorActionResponse(
      "Error! A reminder that only the notification owner may modify/delete/publish their notification!",
    );
  }
  const [startDateIsValid, startTimestamp] = validateDate(payload.startDate);
  const [endDateIsValid, endTimestamp] = validateDate(payload.endDate);
  if (!startDateIsValid || !endDateIsValid) {
    return getErrorActionResponse("Invalid Date!");
  }
  await prisma.$transaction(async (tx) => {
    await tx.inAppNotification.update({
      where: {
        id: notificationId,
      },
      data: {
        type: payload.type,
        title: payload.title,
        message: payload.message,
        startTimestamp,
        endTimestamp,
        allSuppliers: payload.allSuppliers,
      },
    });
    await tx.inAppNotificationOrganization.deleteMany({
      where: {
        inAppNotificationId: notificationId,
      },
    });
    if (!payload.allSuppliers) {
      await tx.inAppNotificationOrganization.createMany({
        data: payload.audienceIds.map((supplierId) => {
          return {
            inAppNotificationId: notificationId,
            organizationId: supplierId,
          };
        }),
      });
    }
  });
  return getSuccessActionResponse();
};

export const deleteNotification = async (
  notificationId: number,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userId } = await getUserInfo();
  const notification = await prisma.inAppNotification.findUnique({
    where: {
      id: notificationId,
      status: InAppNotificationStatus.DRAFT,
      userId,
    },
  });
  if (!notification) {
    return getErrorActionResponse(
      "Error! A reminder that only the notification owner may modify/delete/publish their notification!",
    );
  }
  await prisma.$transaction(async (tx) => {
    await tx.inAppNotificationOrganization.deleteMany({
      where: {
        inAppNotificationId: notificationId,
      },
    });
    await tx.inAppNotification.delete({
      where: {
        id: notificationId,
      },
    });
  });
  return getSuccessActionResponse();
};

export const publishNotification = async (
  notificationId: number,
): Promise<ErrorOrSuccessActionResponse> => {
  const { userId } = await getUserInfo();
  const notification = await prisma.inAppNotification.findUnique({
    where: {
      id: notificationId,
      status: InAppNotificationStatus.DRAFT,
      userId,
    },
  });
  if (!notification) {
    return getErrorActionResponse(
      "Error! A reminder that only the notification owner may modify/delete/publish their notification!",
    );
  }
  let status: InAppNotificationStatus = InAppNotificationStatus.SCHEDULED;
  const startTs = notification.startTimestamp;
  const endTs = notification.endTimestamp;
  const now = new Date();
  if (endTs <= now || endTs <= startTs) {
    status = InAppNotificationStatus.EXPIRED;
  } else if (startTs <= now) {
    status = InAppNotificationStatus.ACTIVE;
  }
  await prisma.inAppNotification.update({
    where: {
      id: notificationId,
    },
    data: {
      status,
    },
  });
  return getSuccessActionResponse();
};
