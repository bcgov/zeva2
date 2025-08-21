import { ContentCard } from "@/app/lib/components";
import { getUserInfo } from "@/auth";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { Suspense } from "react";
import { VehicleHistories } from "../lib/components/VehicleHistories";
import { VehicleDetails } from "../lib/components/VehicleDetails";
import { ActionBar } from "../lib/components/ActionBar";
import { getSerializedVehicle } from "../lib/data";
import { VehicleStatus } from "@/prisma/generated/client";
import { VehicleAttachments } from "../lib/components/VehicleAttachments";
const Page = async (props: { params: Promise<{ id: string }> }) => {
  const { userIsGov } = await getUserInfo();
  const args = await props.params;
  const id = parseInt(args.id);
  const vehicle = await getSerializedVehicle(id);
  if (!vehicle || vehicle.status === VehicleStatus.DELETED) {
    return null;
  }
  return (
    <div className="flex flex-col w-1/3">
      <ContentCard title="Vehicle History">
        <Suspense fallback={<LoadingSkeleton />}>
          <VehicleHistories id={id} />
        </Suspense>
      </ContentCard>
      <ContentCard title="Vehicle Details">
        <Suspense fallback={<LoadingSkeleton />}>
          <VehicleDetails vehicle={vehicle} />
        </Suspense>
      </ContentCard>
      <ContentCard title="Download Additional Documents">
        <Suspense fallback={<LoadingSkeleton />}>
          <VehicleAttachments id={id} />
        </Suspense>
      </ContentCard>
      <ContentCard title="Actions">
        <Suspense fallback={<LoadingSkeleton />}>
          <ActionBar
            userIsGov={userIsGov}
            vehicleId={vehicle.id}
            vehicleStatus={vehicle.status}
          />
        </Suspense>
      </ContentCard>
    </div>
  );
};

export default Page;
