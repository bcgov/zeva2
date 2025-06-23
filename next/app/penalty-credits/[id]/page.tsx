import { ContentCard } from "@/app/lib/components";
import { PenaltyCreditDetails } from "../lib/components/PenaltyCreditDetails";
import { Suspense } from "react";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { PenaltyCreditHistory } from "../lib/components/PenaltyCreditHistory";
import { PenaltyCreditActions } from "../lib/components/PenaltyCreditActions";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const args = await props.params;
  const id = parseInt(args.id, 10);
  return (
    <div>
      <ContentCard title="Penalty Credit History">
        <Suspense fallback={<LoadingSkeleton />}>
          <PenaltyCreditHistory penaltyCreditId={id} />
        </Suspense>
      </ContentCard>
      <ContentCard title="Penalty Credit Details">
        <Suspense fallback={<LoadingSkeleton />}>
          <PenaltyCreditDetails penaltyCreditId={id} />
        </Suspense>
      </ContentCard>
      <ContentCard title="Actions">
        <Suspense fallback={<LoadingSkeleton />}>
          <PenaltyCreditActions penaltyCreditId={id} />
        </Suspense>
      </ContentCard>
    </div>
  );
};

export default Page;
