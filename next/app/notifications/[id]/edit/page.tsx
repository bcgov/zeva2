import { getUserInfo } from "@/auth";
import { getNotification } from "../../lib/services";
import { Role } from "@/prisma/generated/enums";
import { getOrgsMap } from "@/app/lib/data/orgs";
import { Breadcrumbs } from "@/app/lib/components";
import { Routes } from "@/app/lib/constants";
import { NotificationForm } from "../../lib/components/NotificationForm";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const { userId, userRoles } = await getUserInfo();
  if (!userRoles.includes(Role.ZEVA_IDIR_USER)) {
    return null;
  }
  const args = await props.params;
  const notificationId = Number.parseInt(args.id, 10);
  const notification = await getNotification(notificationId);
  if (!notification || notification.ownerId !== userId) {
    return null;
  }
  const orgsMap = await getOrgsMap(null, true);
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
      <div className="p-5 bg-primaryBlueHover rounded-t text-[26px] font-bold text-textOnPrimary">
        Notification ID {notification?.id}
      </div>
      <hr className="border-dividerMedium"></hr>
      <NotificationForm orgsMap={orgsMap} notification={notification} />
    </div>
  );
};

export default Page;
