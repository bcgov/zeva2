import { Suspense } from "react";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { AuditHistoryContent } from "@/app/zev-unit-activities/lib/credit-applications/components/AuditHistoryContent";
import { CreditTransferAuditHistoryContent } from "@/app/zev-unit-activities/lib/credit-transfers/components/CreditTransferAuditHistoryContent";
import { AgreementAuditHistoryContent } from "@/app/zev-unit-activities/lib/credit-agreements/components/AgreementAuditHistoryContent";

const Page = async (props: {
  params: Promise<{ slug: string; id: string }>;
}) => {
  const { slug, id } = await props.params;
  const numericId = Number.parseInt(id, 10);

  if (slug === "credit-applications") {
    return (
      <Suspense fallback={<LoadingSkeleton />}>
        <AuditHistoryContent id={numericId} />
      </Suspense>
    );
  }

  if (slug === "credit-transfers") {
    return (
      <Suspense fallback={<LoadingSkeleton />}>
        <CreditTransferAuditHistoryContent id={numericId} />
      </Suspense>
    );
  }

  if (slug === "credit-agreements") {
    return (
      <Suspense fallback={<LoadingSkeleton />}>
        <AgreementAuditHistoryContent id={numericId} />
      </Suspense>
    );
  }

  return null;
};

export default Page;
