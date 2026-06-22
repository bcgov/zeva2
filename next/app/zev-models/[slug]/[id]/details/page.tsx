import { getUserInfo } from "@/auth";
import { Suspense } from "react";
import { GovDetailsPage } from "@/app/zev-models/lib/components/GovDetailsPage";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { SupplierDetailsPage } from "@/app/zev-models/lib/components/SupplierDetailsPage";

const Page = async (props: {
  params: Promise<{ slug: string; id: string }>;
}) => {
  const { userIsGov, userRoles } = await getUserInfo();
  const args = await props.params;
  const id = Number.parseInt(args.id, 10);
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      {userIsGov ? (
        <GovDetailsPage vehicleId={id} userRoles={userRoles} />
      ) : (
        <SupplierDetailsPage vehicleId={id} userRoles={userRoles} />
      )}
    </Suspense>
  );
};

export default Page;
