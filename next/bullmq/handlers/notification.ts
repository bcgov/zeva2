import { prisma } from "@/lib/prisma";
import { InAppNotificationStatus } from "@/prisma/generated/enums";

export const toggleNotificationsStatus = async () => {
  const notifications = await prisma.inAppNotification.findMany({
    where: {
      status: {
        in: [InAppNotificationStatus.ACTIVE, InAppNotificationStatus.SCHEDULED],
      },
    },
    select: {
      id: true,
      status: true,
      startTimestamp: true,
      endTimestamp: true,
    },
  });
  const toActivate: number[] = [];
  const toExpire: number[] = [];
  const now = new Date();
  for (const notification of notifications) {
    const id = notification.id;
    const status = notification.status;
    const startTs = notification.startTimestamp;
    const endTs = notification.endTimestamp;
    if (status === InAppNotificationStatus.ACTIVE && endTs <= now) {
      toExpire.push(id);
    } else if (
      status === InAppNotificationStatus.SCHEDULED &&
      startTs <= now &&
      startTs < endTs
    ) {
      toActivate.push(id);
    }
  }
  await prisma.$transaction(async (tx) => {
    await tx.inAppNotification.updateMany({
      where: {
        id: {
          in: toActivate,
        },
      },
      data: {
        status: InAppNotificationStatus.ACTIVE,
      },
    });
    await tx.inAppNotification.updateMany({
      where: {
        id: {
          in: toExpire,
        },
      },
      data: {
        status: InAppNotificationStatus.EXPIRED,
      },
    });
  });
};
