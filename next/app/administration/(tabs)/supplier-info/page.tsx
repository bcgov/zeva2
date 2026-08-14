import { getUserInfo } from "@/auth";
import { Suspense } from "react";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { IndividualPage } from "@/app/vehicle-suppliers/lib/components/IndividualPage";

const Page = async () => {
  const { userOrgId } = await getUserInfo();
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <IndividualPage orgId={userOrgId.toString()} />
    </Suspense>
  );
};

export default Page;
