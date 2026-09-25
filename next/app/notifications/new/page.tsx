import { Breadcrumbs } from "@/app/lib/components";
import { getUserInfo } from "@/auth";
import { NotificationForm } from "../lib/components/NotificationForm";
import { Routes } from "@/app/lib/constants";
import { getOrgsMap } from "@/app/lib/data/orgs";
import { canAuthorNotifications } from "../lib/permissions";

const Page = async () => {
  const { userIsGov, userRoles } = await getUserInfo();
  if (!canAuthorNotifications(userIsGov, userRoles)) {
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
            label: "Create New Notification",
          },
        ]}
      />
      <div className="p-5 bg-primaryBlueHover rounded-t text-[26px] font-bold text-textOnPrimary">
        New Notification
      </div>
      <hr className="border-dividerMedium"></hr>
      <div className="flex flex-col gap-6">
        <NotificationForm orgsMap={orgsMap} />
      </div>
    </div>
  );
};

export default Page;
