import { ContentCard } from "@/app/lib/components";
import { getUserInfo } from "@/auth";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { Suspense } from "react";
import VehicleHistories from "../lib/components/VehicleHistories";
import VehicleComments from "../lib/components/VehicleComments";
import Vehicle from "../lib/components/Vehicle";
import CommentInput from "../lib/components/CommentInput";
import ActionBar from "../lib/components/ActionBar";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const { userIsGov, userId, userOrgId } = await getUserInfo();

  const args = await props.params;
  const id = parseInt(args.id);

  return (
    <div className="flex flex-col w-1/3">
      <ContentCard title="Vehicle Details">
        <Suspense fallback={<LoadingSkeleton />}>
          <Vehicle id={id} />
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
          <ActionBar vehicleId={id} userIsGov={userIsGov} />
        </Suspense>
      </ContentCard>
    </div>
  );
};

export default Page;
