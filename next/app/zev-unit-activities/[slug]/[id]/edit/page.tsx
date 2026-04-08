import { Suspense } from "react";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { EditPage as AgreementsPage } from "@/app/zev-unit-activities/lib/credit-agreements/components/EditPage";
import { EditPage as ApplicationsPage } from "@/app/zev-unit-activities/lib/credit-applications/components/EditPage";
import { EditPage as TransfersPage } from "@/app/zev-unit-activities/lib/credit-transfers/components/EditPage";

const Page = async (props: {
  params: Promise<{ slug: string; id: string }>;
}) => {
  const args = await props.params;
  const slug = args.slug;
  const id = args.id;

  let editPage;
  switch (slug) {
    case "credit-agreements":
      editPage = <AgreementsPage id={id} />;
      break;
    case "credit-applications":
      editPage = <ApplicationsPage id={id} />;
      break;
    case "credit-transfers":
      editPage = <TransfersPage id={id} />;
      break;
  }

  if (editPage) {
    return <Suspense fallback={<LoadingSkeleton />}>{editPage}</Suspense>;
  }
  return null;
};

export default Page;
