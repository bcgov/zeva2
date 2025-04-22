import { Suspense } from "react";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { ContentCard } from "@/app/lib/components";
import ZevUnitTransfer from "../lib/components/ZevUnitTransfer";
import ZevUnitTransferHistories from "../lib/components/ZevUnitTransferHistories";
import { getSerializableTransferContent, getTransfer } from "../lib/services";
import { ZevUnitTransferStatuses } from "@/prisma/generated/client";
import { getUserInfo } from "@/auth";
import { getOrgsMap } from "../lib/data";
import {
  saveTransfer,
  submitTransferToPartner,
  ZevUnitTransferPayload,
  deleteTransfer,
} from "../lib/actions";
import { redirect, RedirectType } from "next/navigation";
import { Routes } from "@/app/lib/constants";
import { revalidateAndRedirect } from "@/app/lib/utils/routing";
import ZevUnitTransferCreateOrSave from "../lib/components/ZevUnitTransferCreateOrSave";
import ZevUnitTransferActions from "../lib/components/ZevUnitTransferActions";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const args = await props.params;
  const id = parseInt(args.id, 10);
  const { userOrgId } = await getUserInfo();
  const transfer = await getTransfer(id);
  if (transfer) {
    if (
      transfer.status === ZevUnitTransferStatuses.DRAFT &&
      transfer.transferFromId === userOrgId
    ) {
      const transferCandidatesMap = await getOrgsMap(userOrgId, true);
      const serializedContent = await getSerializableTransferContent(id);
      const path = `${Routes.CreditTransactions}/${id}`;
      const onSave = async (data: ZevUnitTransferPayload) => {
        "use server";
        await saveTransfer(id, data);
        revalidateAndRedirect(path, RedirectType.replace);
      };
      const onDelete = async () => {
        "use server";
        await deleteTransfer(id);
        redirect(Routes.CreditTransactions, RedirectType.push);
      };
      const onSubmit = async () => {
        "use server";
        await submitTransferToPartner(id);
        revalidateAndRedirect(path, RedirectType.replace);
      };
      return (
        <ZevUnitTransferCreateOrSave
          type={"save"}
          transferCandidatesMap={transferCandidatesMap}
          initialTransferTo={transfer.transferToId}
          initialContent={serializedContent}
          onCreateOrSave={onSave}
          onDelete={onDelete}
          onSubmit={onSubmit}
        />
      );
    }
    return (
      <div className="flex flex-col w-1/3">
        <ContentCard title="Transfer History">
          <Suspense fallback={<LoadingSkeleton />}>
            <ZevUnitTransferHistories id={id} />
          </Suspense>
        </ContentCard>
        <ContentCard title="Transfer Details">
          <Suspense fallback={<LoadingSkeleton />}>
            <ZevUnitTransfer id={id} />
          </Suspense>
        </ContentCard>
        <ContentCard title="Actions">
          <Suspense>
            <ZevUnitTransferActions id={id} />
          </Suspense>
        </ContentCard>
      </div>
    );
  }
  return null;
};

export default Page;
