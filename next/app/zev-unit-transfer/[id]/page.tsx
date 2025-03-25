import { Suspense } from "react";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { ContentCard } from "@/app/lib/components";
import ZevUnitTransfer from "../lib/components/ZevUnitTransfer";
import ZevUnitTransferHistories from "../lib/components/ZevUnitTransferHistories";
import ZevUnitTransferComments from "../lib/components/ZevUnitTransferComments";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const args = await props.params;
  const id = parseInt(args.id);
  return (
    <div className="flex flex-col w-1/3">
      <ContentCard title="Transfer History">
        <Suspense fallback={<LoadingSkeleton />}>
          <ZevUnitTransferHistories id={id} />
        </Suspense>
      </ContentCard>
      <ContentCard title="Comments">
        <Suspense fallback={<LoadingSkeleton />}>
          <ZevUnitTransferComments id={id} />
        </Suspense>
      </ContentCard>
      <ContentCard title="Transfer Details">
        <Suspense fallback={<LoadingSkeleton />}>
          <ZevUnitTransfer id={id} />
        </Suspense>
      </ContentCard>
    </div>
  );
};

export default Page;
