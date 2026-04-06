import { ContentCard } from "@/app/lib/components";
import { PenaltyCreditDetails } from "./PenaltyCreditDetails";
import { Suspense } from "react";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { PenaltyCreditHistory } from "./PenaltyCreditHistory";
import { PenaltyCreditActions } from "./PenaltyCreditActions";

export const IndividualPage = async (props: { id: string }) => {
  const id = Number.parseInt(props.id, 10);
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
