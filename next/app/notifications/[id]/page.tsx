import { Breadcrumbs } from "@/app/lib/components";
import { getNotification, getRecipientCount } from "../lib/services";
import { Routes } from "@/app/lib/constants";
import { NotificationDetails } from "../lib/components/NotificationDetails";
import { GovActions } from "../lib/components/GovActions";
import { getUserInfo } from "@/auth";
import { NotificationMessageBanner } from "../lib/components/NotificationMessageBanner";
import { NotificationStatusBanner } from "../lib/components/NotificationStatusBanner";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const { userId } = await getUserInfo();
  const args = await props.params;
  const notificationId = Number.parseInt(args.id, 10);
  const notification = await getNotification(notificationId);
  if (!notification) {
    return null;
  }
  let recipientCount = await getRecipientCount(
    notification.allSuppliers ? "all" : "subset",
    notification.allSuppliers ? undefined : notification.audienceIds,
  );
  return (
    <div className="flex flex-col gap-4">
      <Breadcrumbs
        items={[
          {
            label: "Notifications",
            href: Routes.Notifications,
          },
          {
            label: `Notification ID ${notification.id}`,
          },
        ]}
      />
      <NotificationStatusBanner
        status={notification.status}
        title={notification.title}
        recipientCount={recipientCount}
      />
      <div className="p-5 bg-primaryBlueHover rounded-t text-[26px] font-bold text-textOnPrimary">
        Notification ID {notification?.id}
      </div>
      <hr className="border-dividerMedium"></hr>
      <NotificationDetails
        notification={notification}
        messageBanner={
          <NotificationMessageBanner
            type={notification.type}
            title={notification.title}
            message={notification.message}
          />
        }
      />
      <GovActions
        notificationId={notification.id}
        notificationStatus={notification.status}
        notificationOwnerId={notification.ownerId}
        userId={userId}
      />
    </div>
  );
};

export default Page;
