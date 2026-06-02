import { ContentCard } from "@/app/lib/components";
import { PenaltyCreditDetails } from "./PenaltyCreditDetails";
import { Suspense } from "react";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { PenaltyCreditHistory } from "./PenaltyCreditHistory";
import { getUserInfo } from "@/auth";
import { getPenaltyCredit } from "../data";
import { Role } from "@/prisma/generated/enums";
import { AnalystActions } from "./AnalystActions";
import { DirectorActions } from "./DirectorActions";

export const IndividualPage = async (props: { id: string }) => {
  const { userIsGov, userRoles } = await getUserInfo();
  const penaltyCreditId = Number.parseInt(props.id, 10);
  const penaltyCredit = await getPenaltyCredit(penaltyCreditId);
  if (!penaltyCredit) {
    return null;
  }
  const status = penaltyCredit.status;
  let actionComponent;
  if (userIsGov && userRoles.includes(Role.ZEVA_IDIR_USER)) {
    actionComponent = (
      <AnalystActions penaltyCreditId={penaltyCreditId} status={status} />
    );
  } else if (userIsGov && userRoles.includes(Role.DIRECTOR)) {
    actionComponent = (
      <DirectorActions penaltyCreditId={penaltyCreditId} status={status} />
    );
  }
  return (
    <div>
      <ContentCard title="Penalty Credit History">
        <Suspense fallback={<LoadingSkeleton />}>
          <PenaltyCreditHistory penaltyCreditId={penaltyCreditId} />
        </Suspense>
      </ContentCard>
      <ContentCard title="Penalty Credit Details">
        <Suspense fallback={<LoadingSkeleton />}>
          <PenaltyCreditDetails penaltyCreditId={penaltyCreditId} />
        </Suspense>
      </ContentCard>
      <ContentCard title="Actions">{actionComponent}</ContentCard>
    </div>
  );
};
