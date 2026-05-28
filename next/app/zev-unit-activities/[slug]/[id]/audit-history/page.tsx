import { Suspense } from "react";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { AuditHistoryContent } from "@/app/zev-unit-activities/lib/credit-applications/components/AuditHistoryContent";
import { IndividualNavbar } from "@/app/zev-unit-activities/lib/credit-applications/components/IndividualNavbar";

const Page = async (props: {
  params: Promise<{ slug: string; id: string }>;
}) => {
  const { slug, id } = await props.params;

  if (slug !== "credit-applications") {
    return null;
  }

  const numericId = Number.parseInt(id, 10);

  return (
    <>
      <IndividualNavbar creditApplicationId={id} />
      <Suspense fallback={<LoadingSkeleton />}>
        <AuditHistoryContent id={numericId} />
      </Suspense>
    </>
  );
};

export default Page;
