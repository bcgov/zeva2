import { getUserInfo } from "@/auth";
import { NotificationsTable } from "./lib/components/NotificationsTable";
import { getNotifications } from "./lib/services";
import { canAuthorNotifications } from "./lib/permissions";

const Page = async () => {
  const { userIsGov, userRoles } = await getUserInfo();
  const notifications = await getNotifications();
  return (
    <div className="flex flex-col gap-6">
      <div className="font-bold text-2xl">Notifications</div>
      <NotificationsTable
        notifications={notifications}
        canCreateNotification={canAuthorNotifications(userIsGov, userRoles)}
      />
    </div>
  );
};

export default Page;
