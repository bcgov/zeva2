import { Suspense } from "react";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { NewPage as LegacyReassessmentsPage } from "../../lib/legacy-reassessments/components/NewPage";
import { NewPage as LegacySupplementariesPage } from "../../lib/legacy-supplementaries/components/NewPage";
import { NewPage as MyrPage} from "../../lib/model-year-reports/components/NewPage";

const Page = async (props: { params: Promise<{ slug: string }> }) => {
  const args = await props.params;
  const slug = args.slug;

  let newPage;
  switch (slug) {
    case "legacy-reassessments":
        newPage = <LegacyReassessmentsPage />;
        break;
    case "legacy-supplementaries":
        newPage = <LegacySupplementariesPage />;
        break;
    case "model-year-reports":
        newPage = <MyrPage />;
        break;
  }

  if (newPage) {
    return (
        <Suspense fallback={<LoadingSkeleton />}>
            {newPage}
        </Suspense>
    )
  }
  return null;
};

export default Page;
