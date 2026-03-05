import { JSX, Suspense } from "react";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { ContentCard } from "@/app/lib/components";
import { getUserInfo } from "@/auth";
import { CreditTransferHistories } from "../lib/components/CreditTransferHistories";
import { CreditTransferDetails } from "../lib/components/CreditTransferDetails";
import { getTransfer } from "../lib/services";
import { TransferFromActions } from "../lib/components/TransferFromActions";
import { TransferToActions } from "../lib/components/TransferToActions";
import { CreditTransferStatus, Role } from "@/prisma/generated/enums";
import { DirectorActions } from "../lib/components/DirectorActions";
import { AnalystActions } from "../lib/components/AnalystActions";
import { transferFromSupplierRescindableStatuses } from "../lib/constants";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const args = await props.params;
  const id = Number.parseInt(args.id, 10);
  const { userIsGov, userOrgId, userRoles } = await getUserInfo();
  const transfer = await getTransfer(id);
  if (!transfer) {
    return null;
  }
  const status = transfer.status;
  let actionComponent: JSX.Element | null = null;
  if (!userIsGov && userOrgId === transfer.transferFromId) {
    if (status === CreditTransferStatus.DRAFT) {
      actionComponent = <TransferFromActions id={id} type="draft" />;
    } else if (transferFromSupplierRescindableStatuses.includes(status)) {
      actionComponent = <TransferFromActions id={id} type="rescindable" />;
    }
  } else if (
    !userIsGov &&
    userOrgId === transfer.transferToId &&
    status === CreditTransferStatus.SUBMITTED_TO_TRANSFER_TO
  ) {
    actionComponent = <TransferToActions id={id} />;
  } else if (userIsGov && userRoles.includes(Role.DIRECTOR)) {
    actionComponent = <DirectorActions id={id} status={status} />;
  } else if (userIsGov && userRoles.includes(Role.ZEVA_IDIR_USER)) {
    actionComponent = <AnalystActions id={id} status={status} />;
  }
  return (
    <div className="flex flex-col w-1/3">
      <ContentCard title="Transfer History">
        <Suspense fallback={<LoadingSkeleton />}>
          <CreditTransferHistories id={id} />
        </Suspense>
      </ContentCard>
      <ContentCard title="Transfer Details">
        <Suspense fallback={<LoadingSkeleton />}>
          <CreditTransferDetails id={id} />
        </Suspense>
      </ContentCard>
      <ContentCard title="Actions">
        <Suspense>{actionComponent}</Suspense>
      </ContentCard>
    </div>
  );
};

export default Page;
