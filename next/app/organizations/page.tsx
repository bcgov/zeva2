import { getObject } from "@/lib/utils/urlSearchParams";
import { Suspense } from "react";
import { LoadingSkeleton } from "../lib/components/skeletons";
import { OrganizationList } from "./lib/components/OrganizationList";

const Page = async (props: {
  searchParams?: Promise<{
    page?: string;
    pageSize?: string;
    filters?: string;
    sorts?: string;
  }>;
}) => {
  const searchParams = await props.searchParams;
  const page = parseInt(searchParams?.page ?? "") || 1;
  const pageSize = parseInt(searchParams?.pageSize ?? "") || 10;
  const filters = getObject(searchParams?.filters ?? null);
  const sorts = getObject(searchParams?.sorts ?? null);

  return (
    <Suspense key={Date.now()} fallback={<LoadingSkeleton />}>
      <OrganizationList
        page={page}
        pageSize={pageSize}
        filters={filters}
        sorts={sorts}
      />
    </Suspense>
  );
};

export default Page;