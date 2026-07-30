import { Suspense } from "react";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { IndividualPage as AgreementsPage } from "../../../lib/credit-agreements/components/IndividualPage";
import { IndividualPageSupplier as ApplicationsPageSupplier } from "../../../lib/credit-applications/components/IndividualPageSupplier";
import { IndividualPageGov as ApplicationsPageGov } from "../../../lib/credit-applications/components/IndividualPageGov";
import { IndividualPage as TransfersPage } from "../../../lib/credit-transfers/components/IndividualPage";
import { IndividualPage as PenaltyCreditsPage } from "../../../lib/penalty-credits/components/IndividualPage";
import { getUserInfo } from "@/auth";

const Page = async (props: {
  params: Promise<{ slug: string; id: string }>;
}) => {
  const args = await props.params;
  const { userIsGov } = await getUserInfo();
  const slug = args.slug;
  const id = args.id;

  let individualPage;
  switch (slug) {
    case "credit-agreements":
      individualPage = <AgreementsPage id={id} />;
      break;
    case "credit-applications":
      if (userIsGov) {
        individualPage = <ApplicationsPageGov id={id} />;
      } else {
        individualPage = <ApplicationsPageSupplier id={id} />;
      }
      break;
    case "credit-transfers":
      individualPage = <TransfersPage id={id} />;
      break;
    case "penalty-credits":
      individualPage = <PenaltyCreditsPage id={id} />;
      break;
  }

  if (individualPage) {
    return <Suspense fallback={<LoadingSkeleton />}>{individualPage}</Suspense>;
  }
  return null;
};

export default Page;
