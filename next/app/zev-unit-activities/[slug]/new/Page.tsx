import { Suspense } from "react";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { NewPage as AgreementsPage } from "../../lib/credit-agreements/components/NewPage";
import { NewPage as ApplicationsPage } from "../../lib/credit-applications/components/NewPage";
import { NewPage as TransfersPage } from "../../lib/credit-transfers/components/NewPage";
import { NewPage as PenaltyCreditsPage } from "../../lib/penalty-credits/components/NewPage";

const Page = async (props: { params: Promise<{ slug: string }> }) => {
  const args = await props.params;
  const slug = args.slug;

  let newPage;
  switch (slug) {
    case "credit-agreements":
        newPage = <AgreementsPage />
        break;
    case "credit-applications":
        newPage = <ApplicationsPage />;
        break;
    case "credit-transfers":
        newPage = <TransfersPage />;
        break;
    case "penalty-credits":
        newPage = <PenaltyCreditsPage />;
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
