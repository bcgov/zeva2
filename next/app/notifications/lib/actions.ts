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
import { InAppNotificationStatus } from "@/prisma/generated/enums";
import { NotificationPayload } from "./constants";
import { getNotificationPayload } from "./utilsClient";
import { canAuthorNotifications } from "./permissions";

type PayloadValidation =
  | { success: true; payload: NotificationPayload }
  | { success: false; error: string };

const validatePayload = (payload: NotificationPayload): PayloadValidation => {
  try {
    return { success: true, payload: getNotificationPayload(payload) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Invalid notification!",
    };
  }
};

export const createNotification = async (
  payload: NotificationPayload,
): Promise<DataOrErrorActionResponse<number>> => {
  const { userIsGov, userId, userRoles } = await getUserInfo();
  if (!canAuthorNotifications(userIsGov, userRoles)) {
    return getErrorActionResponse("Unauthorized!");
  }
  const validation = validatePayload(payload);
  if (!validation.success) {
    return getErrorActionResponse(validation.error);
  }
  const validatedPayload = validation.payload;
  const [startDateIsValid, startTimestamp] = validateDate(
    validatedPayload.startDate,
  );
  const [endDateIsValid, endTimestamp] = validateDate(validatedPayload.endDate);
  if (!startDateIsValid || !endDateIsValid) {
    return getErrorActionResponse("Invalid Date!");
  }
  let notificationId = Number.NaN;
  await prisma.$transaction(async (tx) => {
    const { id: createdNotificationId } = await tx.inAppNotification.create({
      data: {
        userId,
        status: InAppNotificationStatus.DRAFT,
        type: validatedPayload.type,
        title: validatedPayload.title,
        message: validatedPayload.message,
        startTimestamp,
        endTimestamp,
        allSuppliers: validatedPayload.allSuppliers,
      },
    });
    notificationId = createdNotificationId;
    if (!validatedPayload.allSuppliers) {
      await tx.inAppNotificationOrganization.createMany({
        data: validatedPayload.audienceIds.map((supplierId) => {
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
  const { userIsGov, userId, userRoles } = await getUserInfo();
  if (!canAuthorNotifications(userIsGov, userRoles)) {
    return getErrorActionResponse("Unauthorized!");
  }
  const validation = validatePayload(payload);
  if (!validation.success) {
    return getErrorActionResponse(validation.error);
  }
  const validatedPayload = validation.payload;
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
  const [startDateIsValid, startTimestamp] = validateDate(
    validatedPayload.startDate,
  );
  const [endDateIsValid, endTimestamp] = validateDate(validatedPayload.endDate);
  if (!startDateIsValid || !endDateIsValid) {
    return getErrorActionResponse("Invalid Date!");
  }
  await prisma.$transaction(async (tx) => {
    await tx.inAppNotification.update({
      where: {
        id: notificationId,
      },
      data: {
        type: validatedPayload.type,
        title: validatedPayload.title,
        message: validatedPayload.message,
        startTimestamp,
        endTimestamp,
        allSuppliers: validatedPayload.allSuppliers,
      },
    });
    await tx.inAppNotificationOrganization.deleteMany({
      where: {
        inAppNotificationId: notificationId,
      },
    });
    if (!validatedPayload.allSuppliers) {
      await tx.inAppNotificationOrganization.createMany({
        data: validatedPayload.audienceIds.map((supplierId) => {
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
