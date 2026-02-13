import { Suspense } from "react";
import { getPageParams, pageStringParams } from "@/app/lib/utils/nextPage";
import { fetchUsers } from "./lib/data";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import Link from "next/link";
import { Routes } from "../lib/constants";
import { Button } from "../lib/components";
import { getUserInfo } from "@/auth";
import UserTable from "./lib/components/UserTable";
import { userIsAdmin } from "./lib/utilsServer";
import {
  USER_TAB_CONFIG,
  applyUserTabFilters,
  defaultUserTab,
  getFilterStringForUserTab,
  getUserTabFromParam,
  UserTabKey,
} from "./lib/userTabs";

export default async function Page(props: {
  searchParams?: Promise<pageStringParams & { tab?: string }>;
}) {
  const { userIsGov } = await getUserInfo();
  const isAdmin = await userIsAdmin();
  const searchParams = await props.searchParams;
  const tab: UserTabKey = getUserTabFromParam(searchParams?.tab);
  const { filters, sorts } = getPageParams(searchParams, 1, 10);
  const tabbedFilters = applyUserTabFilters(filters, tab);
  const { users } = await fetchUsers(
    1,
    0,
    tabbedFilters,
    sorts,
    { paginate: false },
  );

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      {isAdmin && (
        <Link href={`${Routes.Users}/new`}>
          <Button variant="primary">Create New User</Button>
        </Link>
      )}
      <div className="mb-4 flex gap-2 border-b">
        {(Object.keys(USER_TAB_CONFIG) as UserTabKey[]).map((tabKey) => (
          <Link
            key={tabKey}
            href={{
              pathname: Routes.Users,
              query: {
                ...(searchParams ?? {}),
                page: "1",
                tab: tabKey,
                filters: getFilterStringForUserTab(filters, tabKey),
              },
            }}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${
              tabKey === tab
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {USER_TAB_CONFIG[tabKey].label}
          </Link>
        ))}
      </div>
      <UserTable
        users={users}
        userIsGov={userIsGov}
        tab={tab ?? defaultUserTab}
      />
    </Suspense>
  );
}
