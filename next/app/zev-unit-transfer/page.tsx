import { Suspense } from "react";
import { LoadingSkeleton } from "../lib/components/skeletons";
import { getPageParams, pageStringParams } from "../lib/utils/nextPage";
import ZevUnitTransferList from "./lib/components/ZevUnitTransferList";

const Page = async (props: { searchParams?: Promise<pageStringParams> }) => {
  const searchParams = await props.searchParams;
  const { page, pageSize, filters, sorts } = getPageParams(searchParams, 1, 10);

  return (
    <Suspense key={Date.now()} fallback={<LoadingSkeleton />}>
      <ZevUnitTransferList
        page={page}
        pageSize={pageSize}
        filters={filters}
        sorts={sorts}
      />
    </Suspense>
  );
};

export default Page;
