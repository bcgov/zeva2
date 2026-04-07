import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { ListPage as TransactionsPage } from "@/app/zev-unit-activities/lib/zev-unit-transactions/components/ListPage";
import { getUserInfo } from "@/auth";
import { Suspense } from "react";

export const Page = async (props: { params: Promise<{ id: string }> }) => {
  const { userIsGov } = await getUserInfo();
  if (!userIsGov) {
    return null;
  }
  const { id } = await props.params;
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <TransactionsPage orgId={id} />
    </Suspense>
  );
};
