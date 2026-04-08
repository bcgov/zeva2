import { Suspense } from "react";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { IndividualPage as LegacyReassessmentsPage } from "../../lib/legacy-reassessments/components/IndividualPage";
import { IndividualPage as LegacySupplementariesPage } from "../../lib/legacy-supplementaries/components/IndividualPage";
import { IndividualPage as MyrPage } from "../../lib/model-year-reports/components/IndividualPage";

const Page = async (props: {
  params: Promise<{ slug: string; id: string }>;
}) => {
  const args = await props.params;
  const slug = args.slug;
  const id = args.id;

  let individualPage;
  switch (slug) {
    case "legacy-reassessments":
      individualPage = <LegacyReassessmentsPage id={id} />;
      break;
    case "legacy-supplementaries":
      individualPage = <LegacySupplementariesPage id={id} />;
      break;
    case "model-year-reports":
      individualPage = <MyrPage id={id} />;
      break;
  }

  if (individualPage) {
    return <Suspense fallback={<LoadingSkeleton />}>{individualPage}</Suspense>;
  }
  return null;
};

export default Page;
