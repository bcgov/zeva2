import { StatusBanner, StatusBannerVariant } from "@/app/lib/components";
import { getNotificationTypeEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { InAppNotificationType } from "@/prisma/generated/enums";

export const NotificationMessageBanner = (props: {
  type: InAppNotificationType;
  title: string;
  message: string;
}) => {
  const typesMap = getNotificationTypeEnumsToStringsMap();
  let variant: StatusBannerVariant | null = null;
  if (
    props.type === InAppNotificationType.ACTION_REQUIRED ||
    props.type === InAppNotificationType.WARNING
  ) {
    variant = "warning";
  } else if (
    props.type === InAppNotificationType.INFORMATION ||
    props.type === InAppNotificationType.REMINDER ||
    props.type === InAppNotificationType.SYSTEM_MAINTENANCE
  ) {
    variant = "info";
  }
  if (!variant) {
    return null;
  }
  return (
    <StatusBanner
      variant={variant}
      title={`${typesMap[props.type]}: ${props.title}`}
      primaryText={null}
      secondaryText={props.message}
    />
  );
};
