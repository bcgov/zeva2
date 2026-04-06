import { Suspense } from "react";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { IndividualPage as AgreementsPage } from "../../lib/credit-agreements/components/IndividualPage";
import { IndividualPage as ApplicationsPage } from "../../lib/credit-applications/components/IndividualPage";
import { IndividualPage as TransfersPage } from "../../lib/credit-transfers/components/IndividualPage";
import { IndividualPage as PenaltyCreditsPage } from "../../lib/penalty-credits/components/IndividualPage";

const Page = async (props: { params: Promise<{ slug: string, id: string }> }) => {
  const args = await props.params;
  const slug = args.slug;
  const id = args.id;

  let individualPage;
  switch (slug) {
    case "credit-agreements":
        individualPage = <AgreementsPage id={id}/>
        break;
    case "credit-applications":
        individualPage = <ApplicationsPage id={id} />;
        break;
    case "credit-transfers":
        individualPage = <TransfersPage id={id} />;
        break;
    case "penalty-credits":
        individualPage = <PenaltyCreditsPage id={id} />;
        break;
  }

  if (individualPage) {
    return (
        <Suspense fallback={<LoadingSkeleton />}>
            {individualPage}
        </Suspense>
    )
  }
  return null;
};

export default Page;
