import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { getPageParams, pageStringParams } from "@/app/lib/utils/nextPage";
import { Suspense } from "react";
import { RecordsList } from "../../lib/components/RecordsList";
import { ModelNameMismatches } from "../../lib/components/ModelNameMismatches";
import { ApplicationCreateOrEdit } from "../../lib/components/ApplicationCreateOrEdit";

const Page = async (props: {
  params: Promise<{ id: string; slug: string }>;
  searchParams?: Promise<pageStringParams & { readOnly?: "Y" }>;
}) => {
  const args = await props.params;
  const searchParams = await props.searchParams;
  const readOnly = searchParams?.readOnly ? true : false;
  const id = parseInt(args.id, 10);
  const slug = args.slug;
  const { page, pageSize, filters, sorts } = getPageParams(
    searchParams,
    1,
    100,
  );
  if (slug === "validated") {
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
  } else if (slug === "model-name-mismatches") {
    return (
      <Suspense fallback={<LoadingSkeleton />}>
        <ModelNameMismatches creditApplicationId={id} />
      </Suspense>
    );
  } else if (slug === "edit") {
    return <ApplicationCreateOrEdit creditApplicationId={id} />;
  }
  return null;
};

export default Page;
