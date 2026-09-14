import { prisma } from "@/lib/prisma";
import {
  SerializedNotificationFull,
  SerializedNotificationSparse,
} from "./constants";
import {
  serializeNotificationFull,
  serializeNotificationSparse,
} from "./utilsServer";
import { InAppNotificationStatus } from "@/prisma/generated/enums";

// expect at most 25 notifications per year; over 20 years, that's 500;
// therefore, no need for pagination;
// intended for gov users
export const getNotifications = async (): Promise<
  SerializedNotificationSparse[]
> => {
  const notifications = await prisma.inAppNotification.findMany({
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      inAppNotificationOrganizations: {
        select: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      id: "desc",
    },
  });
  return notifications.map((n) => {
    return serializeNotificationSparse(n);
  });
};

// intended for gov users
export const getNotification = async (
  notificationId: number,
): Promise<SerializedNotificationFull | null> => {
  const notification = await prisma.inAppNotification.findUnique({
    where: {
      id: notificationId,
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      inAppNotificationOrganizations: {
        select: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });
  if (!notification) {
    return null;
  }
  return serializeNotificationFull(notification);
};

// intended for gov users
export const getRecipientCount = async (
  type: "all" | "subset",
  orgIds?: number[],
) => {
  let result: number = 0;
  if (type === "all") {
    const users = await prisma.user.findMany({
      where: {
        organization: {
          isGovernment: false,
        },
      },
      select: {
        id: true,
      },
    });
    result = users.length;
  } else if (type === "subset" && orgIds) {
    const users = await prisma.user.findMany({
      where: {
        organizationId: {
          in: orgIds,
        },
      },
      select: {
        id: true,
      },
    });
    result = users.length;
  }
  return result;
};

// intended for supplier users
export const getActiveNotifications = async (orgId: number) => {
  const notifications = await prisma.inAppNotification.findMany({
    where: {
      status: InAppNotificationStatus.ACTIVE,
      OR: [
        { allSuppliers: true },
        {
          inAppNotificationOrganizations: {
            some: {
              organizationId: orgId,
            },
          },
        },
      ],
    },
    select: {
      type: true,
      title: true,
      message: true,
    },
    orderBy: {
      startTimestamp: "desc",
    },
  });
  return notifications;
};
