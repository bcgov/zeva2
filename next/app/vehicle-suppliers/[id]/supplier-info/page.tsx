import { Suspense } from "react";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { IndividualPage } from "../../lib/components/IndividualPage";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const { id } = await props.params;
  return (
    <div className="p-6">
      <Suspense fallback={<LoadingSkeleton />}>
        <IndividualPage orgId={id} />
      </Suspense>
    </div>
  );
};

export default Page;
