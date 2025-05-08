import { Suspense } from "react";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { ContentCard } from "@/app/lib/components";
import VehicleHistories from "../lib/components/VehicleHistories";
import VehicleComments from "../lib/components/VehicleComments";
import Vehicle from "../lib/components/Vehicle";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const args = await props.params;
  const id = parseInt(args.id);
  return (
    <div className="flex flex-col w-1/3">
      <ContentCard title="Vehicle Details">
        <Suspense fallback={<LoadingSkeleton />}>
          <Vehicle id={id} />
        </Suspense>
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
      <ContentCard title="Actions">Todo</ContentCard>
    </div>
  );
};

export default Page;
