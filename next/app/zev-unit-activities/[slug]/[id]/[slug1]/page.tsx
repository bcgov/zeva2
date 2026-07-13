import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { getPageParams, pageStringParams } from "@/app/lib/utils/nextPage";
import { Suspense } from "react";
import { RecordsList } from "@/app/zev-unit-activities/lib/credit-applications/components/RecordsList";
import { ModelNameMismatches } from "@/app/zev-unit-activities/lib/credit-applications/components/ModelNameMismatches";
import { getUserInfo } from "@/auth";
import { getCreditApplication } from "@/app/zev-unit-activities/lib/credit-applications/data";

const Page = async (props: {
  params: Promise<{ slug: string; id: string; slug1: string }>;
  searchParams?: Promise<pageStringParams & { readOnly?: "Y" }>;
}) => {
  const [args, searchParams, { userIsGov }] = await Promise.all([
    props.params,
    props.searchParams,
    getUserInfo(),
  ]);
  if (!userIsGov) {
    return null;
  }
  const slug = args.slug;
  const id = Number.parseInt(args.id, 10);
  const slug1 = args.slug1;
  const readOnly = searchParams?.readOnly ? true : false;
  const [creditApplication, { page, pageSize, filters, sorts }] =
    await Promise.all([
      getCreditApplication(id),
      getPageParams(searchParams, 1, 100),
    ]);
  if (!creditApplication) {
    return null;
  }

  if (slug === "credit-applications" && slug1 === "validated") {
    return (
      <Suspense fallback={<LoadingSkeleton />}>
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
  } else if (
    slug === "credit-applications" &&
    slug1 === "model-name-mismatches"
  ) {
    return (
      <Suspense fallback={<LoadingSkeleton />}>
        <ModelNameMismatches creditApplicationId={id} />
      </Suspense>
    );
  }
  return null;
};

export default Page;
