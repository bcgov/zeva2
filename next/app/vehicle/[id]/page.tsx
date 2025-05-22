import { ContentCard } from "@/app/lib/components";
import { getUserInfo } from "@/auth";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { Suspense } from "react";
import VehicleHistories from "../lib/components/VehicleHistories";
import VehicleComments from "../lib/components/VehicleComments";
import VehicleDetails from "../lib/components/VehicleDetails";
import CommentInput from "../lib/components/CommentInput";
import ActionBar from "../lib/components/ActionBar";
import { getVehicle } from "../lib/data";
const Page = async (props: { params: Promise<{ id: string }> }) => {
  const { userIsGov, userId, userOrgId } = await getUserInfo();

  const args = await props.params;
  const id = parseInt(args.id);
  const vehicle = await getVehicle(id);
  const parsedVehicle = JSON.parse(JSON.stringify(vehicle));
  return (
    <div className="flex flex-col w-1/3">
      <ContentCard title="Vehicle Details">
        <Suspense fallback={<LoadingSkeleton />}>
          <VehicleDetails id={id} vehicle={parsedVehicle} />
        </Suspense>
      </ContentCard>
      <ContentCard title="Add New Comment">
        <CommentInput vehicleId={id} />
      </ContentCard>
      <ContentCard title="Comments">
        <Suspense fallback={<LoadingSkeleton />}>
          <VehicleComments id={id} />
        </Suspense>
      </ContentCard>
      <ContentCard title="Vehicle History">
        <Suspense fallback={<LoadingSkeleton />}>
          <VehicleHistories id={id} />
        </Suspense>
      </ContentCard>
      <ContentCard title="Actions">
        <Suspense fallback={<LoadingSkeleton />}>
          <ActionBar
            vehicleId={id}
            userIsGov={userIsGov}
            vehicle={parsedVehicle}
          />
        </Suspense>
      </ContentCard>
    </div>
  );
};

export default Page;
