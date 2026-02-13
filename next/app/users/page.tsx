import { Suspense } from "react";
import { fetchUsers, GovUserCategory, SupplierUserCategory } from "./lib/data";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import Link from "next/link";
import { Routes } from "../lib/constants";
import { Button } from "../lib/components";
import { getUserInfo } from "@/auth";
import { UserTable } from "./lib/components/UserTable";
import { userIsAdmin } from "./lib/utilsServer";
import { categoriesToTabsMap } from "./lib/constants";

export default async function Page(props: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const { userIsGov } = await getUserInfo();
  const isAdmin = await userIsAdmin();
  const searchParams = await props.searchParams;
  const tab = searchParams?.tab;
  let currentCategory: GovUserCategory | SupplierUserCategory | null = null;
  if (!tab && userIsGov) {
    currentCategory = "idir";
  } else if (!tab && !userIsGov) {
    currentCategory = "active";
  } else if (
    userIsGov &&
    (tab === "idir" || tab === "bceid" || tab === "inactive")
  ) {
    currentCategory = tab;
  } else if (!userIsGov && (tab === "active" || tab === "inactive")) {
    currentCategory = tab;
  }
  if (!currentCategory) {
    return null;
  }
  const users = await fetchUsers(currentCategory);
  const categoriesToUse: (GovUserCategory | SupplierUserCategory)[] = userIsGov
    ? ["idir", "bceid", "inactive"]
    : ["active", "inactive"];

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      {isAdmin && (
        <Link href={`${Routes.Users}/new`}>
          <Button variant="primary">Create New User</Button>
        </Link>
      )}
      <div className="mb-4 flex gap-2 border-b">
        {categoriesToUse.map((category) => (
          <Link
            key={category}
            href={{
              pathname: Routes.Users,
              query: {
                tab: category,
              },
            }}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${
              currentCategory === category
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {categoriesToTabsMap[category]}
          </Link>
        ))}
      </div>
      <UserTable
        users={users}
        userIsGov={userIsGov}
        category={currentCategory}
      />
    </Suspense>
  );
}
