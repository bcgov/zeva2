import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { getPageParams, pageStringParams } from "@/app/lib/utils/nextPage";
import { Suspense } from "react";
import { RecordsList } from "../../lib/components/RecordsList";

const Page = async (props: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<pageStringParams & { readOnly?: "Y" }>;
}) => {
  const args = await props.params;
  const searchParams = await props.searchParams;
  const readOnly = searchParams?.readOnly ? true : false;
  const id = parseInt(args.id, 10);
  const { page, pageSize, filters, sorts } = getPageParams(
    searchParams,
    1,
    100,
  );
  return (
    <Suspense key={Date.now()} fallback={<LoadingSkeleton />}>
      <RecordsList
        id={id}
        page={page}
        pageSize={pageSize}
        filters={filters}
        sorts={sorts}
        readOnly={readOnly}
      />
    </Suspense>
  );
};

export default Page;
