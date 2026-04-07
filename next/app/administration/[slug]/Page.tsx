// for gov users: slug should be idir, bceid, or inactive; displays list of users based on slug
// for supplier users: slug should be an id; in this case, can view/edit user

import { Suspense } from "react";
import { fetchUsers } from "../lib/data";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { getUserInfo } from "@/auth";
import { UserTable } from "@/app/administration/lib/components/UserTable";
import { userIsAdmin } from "@/app/administration/lib/utilsServer";
import { getUser } from "../lib/data";
import { UserForm } from "../lib/components/UserForm";
import { getGovOrgId } from "@/app/vehicle-suppliers/lib/data";

export const Page = async (props: {
  params: Promise<{ slug: string }>
}) => {
  const args = await props.params;
  const slug = args.slug;
  const { userIsGov, userOrgId } = await getUserInfo();
  const isAdmin = await userIsAdmin();
  if (userIsGov && isAdmin && (slug === "idir" || slug === "bceid" || slug === "inactive")) {
    const users = await fetchUsers(slug);
    return (
        <Suspense fallback={<LoadingSkeleton />}>
        <UserTable
            users={users}
            userIsGov={userIsGov}
            category={slug}
            isAdmin={isAdmin}
        />
        </Suspense>
    );
  } else if (!userIsGov && isAdmin) {
    const id = Number.parseInt(slug, 10);
    if (Number.isNaN(id)) {
        return null;
    }
    const user = await getUser(id);
    if (!user) {
        return null;
    }
    const govOrgId = await getGovOrgId();
    return (
        <div className="w-full px-6 py-6 lg:px-10 xl:px-14">
          <UserForm
            user={user}
            userOrgId={userOrgId.toString()}
            govOrgId={govOrgId.toString()}
          />
        </div>
      );
  }
  return null;
}

export default Page;
