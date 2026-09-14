import { getUserInfo } from "@/auth";
import { NotificationsTable } from "./lib/components/NotificationsTable";
import { getNotifications } from "./lib/services";
import { Role } from "@/prisma/generated/enums";

const Page = async () => {
  const { userRoles } = await getUserInfo();
  const notifications = await getNotifications();
  return (
    <div className="flex flex-col gap-6">
      <div className="font-bold text-2xl">Notifications</div>
      <NotificationsTable
        notifications={notifications}
        canCreateNotification={userRoles.includes(Role.ZEVA_IDIR_USER)}
      />
    </div>
  );
};

export default Page;
