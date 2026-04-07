import { Suspense } from "react";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { EditPage as LegacyReassessmentsPage } from "@/app/compliance-reporting/lib/legacy-reassessments/components/EditPage";
import { EditPage as LegacySupplementariesPage } from "@/app/compliance-reporting/lib/legacy-supplementaries/components/EditPage";
import { EditPage as MyrPage } from "@/app/compliance-reporting/lib/model-year-reports/components/EditPage";

const Page = async (props: { params: Promise<{ slug: string, id: string }> }) => {
  const args = await props.params;
  const slug = args.slug;
  const id = args.id;

  let editPage;
  switch (slug) {
    case "legacy-reassessments":
        editPage = <LegacyReassessmentsPage id={id}/>
        break;
    case "legacy-supplementaries":
        editPage = <LegacySupplementariesPage id={id} />;
        break;
    case "model-year-reports":
        editPage = <MyrPage id={id} />;
        break;
  }

  if (editPage) {
    return (
        <Suspense fallback={<LoadingSkeleton />}>
            {editPage}
        </Suspense>
    )
  }
  return null;
};

export default Page;
