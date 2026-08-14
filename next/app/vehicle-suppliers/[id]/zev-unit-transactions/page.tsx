import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { ListPage as TransactionsPage } from "@/app/zev-unit-activities/lib/zev-unit-transactions/components/ListPage";
import { Suspense } from "react";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const { id } = await props.params;
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <TransactionsPage orgId={id} />
    </Suspense>
  );
};

export default Page;
