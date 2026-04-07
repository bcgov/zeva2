import { Suspense } from "react";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { pageStringParams } from "@/app/lib/utils/nextPage";
import { ListPage as AgreementsPage } from "../lib/credit-agreements/components/ListPage";
import { ListPage as ApplicationsPage } from "../lib/credit-applications/components/ListPage";
import { ListPage as TransfersPage } from "../lib/credit-transfers/components/ListPage";
import { ListPage as PenaltyCreditsPage } from "../lib/penalty-credits/components/ListPage";
import { ListPage as TransactionsPage } from "../lib/zev-unit-transactions/components/ListPage";

const Page = async (props: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<pageStringParams>;
}) => {
  const args = await props.params;
  const searchParams = await props.searchParams;
  const slug = args.slug;

  let listPage;
  switch (slug) {
    case "credit-agreements":
      listPage = <AgreementsPage searchParams={searchParams} />;
      break;
    case "credit-applications":
      listPage = <ApplicationsPage searchParams={searchParams} />;
      break;
    case "credit-transfers":
      listPage = <TransfersPage />;
      break;
    case "penalty-credits":
      listPage = <PenaltyCreditsPage searchParams={searchParams} />;
      break;
    case "zev-unit-transactions":
      listPage = <TransactionsPage />;
      break;
  }

  if (listPage) {
    return <Suspense fallback={<LoadingSkeleton />}>{listPage}</Suspense>;
  }
  return null;
};

export default Page;
