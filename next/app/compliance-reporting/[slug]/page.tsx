import { Suspense } from "react";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { CalculatorPage } from "../lib/compliance-calculator/components/CalculatorPage";
import { RatiosPage } from "../lib/compliance-ratios/components/RatiosPage";
import { ListPage as LegacyReassessmentsPage } from "../lib/legacy-reassessments/components/ListPage";
import { ListPage as LegacySupplementariesPage } from "../lib/legacy-supplementaries/components/ListPage";
import { ListPage as MyrPage } from "../lib/model-year-reports/components/ListPage";

const Page = async (props: { params: Promise<{ slug: string }> }) => {
  const args = await props.params;
  const slug = args.slug;

  let page;
  switch (slug) {
    case "compliance-calculator":
      page = <CalculatorPage />;
      break;
    case "compliance-ratios":
      page = <RatiosPage />;
      break;
    case "legacy-reassessments":
      page = <LegacyReassessmentsPage />;
      break;
    case "legacy-supplementaries":
      page = <LegacySupplementariesPage />;
      break;
    case "model-year-reports":
      page = <MyrPage />;
      break;
  }

  if (page) {
    return <Suspense fallback={<LoadingSkeleton />}>{page}</Suspense>;
  }
  return null;
};

export default Page;
