import { ContentCard } from "@/app/lib/components";
import { Suspense } from "react";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { UserDetails } from "../lib/components/UserDetails";
import { ActionBar } from "../lib/components/ActionBar";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const args = await props.params;
  const id = parseInt(args.id, 10);
  return (
    <div className="flex flex-col w-1/3">
      <ContentCard title="User Details">
        <Suspense fallback={<LoadingSkeleton />}>
          <UserDetails userId={id} />
        </Suspense>
      </ContentCard>
      <ContentCard title="Actions">
        <Suspense fallback={<LoadingSkeleton />}>
          <ActionBar userId={id} />
        </Suspense>
      </ContentCard>
    </div>
  );
};

export default Page;
