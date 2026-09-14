import { StatusBanner, StatusBannerVariant } from "@/app/lib/components";
import { getNotificationStatusEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { InAppNotificationStatus } from "@/prisma/generated/enums";

export const NotificationStatusBanner = (props: {
  status: InAppNotificationStatus;
  title: string;
  recipientCount: number;
}) => {
  const statusMap = getNotificationStatusEnumsToStringsMap();
  let variant: StatusBannerVariant | null = null;
  let secondaryText: string | null = null;
  if (props.status === InAppNotificationStatus.DRAFT) {
    variant = "draft";
  } else if (
    props.status === InAppNotificationStatus.ACTIVE ||
    props.status === InAppNotificationStatus.SCHEDULED
  ) {
    variant = "success";
    if (props.status === InAppNotificationStatus.SCHEDULED) {
      secondaryText = `Your system notification "${props.title}" has been queued. It will be visible to ${props.recipientCount} recipients across all matching suppliers over the scheduled dates.`;
    } else if (props.status === InAppNotificationStatus.ACTIVE) {
      secondaryText = `Your system notification "${props.title}" is visible to ${props.recipientCount} recipients across all matching suppliers.`;
    }
  } else if (props.status === InAppNotificationStatus.EXPIRED) {
    variant = "info";
  }
  if (!variant) {
    return null;
  }
  return (
    <StatusBanner
      variant={variant}
      title={`STATUS - ${statusMap[props.status]}`}
      primaryText={null}
      secondaryText={secondaryText}
    />
  );
};
