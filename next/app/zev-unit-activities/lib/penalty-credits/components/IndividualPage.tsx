import { ContentCard, StatusBanner } from "@/app/lib/components";
import { PenaltyCreditDetails } from "./PenaltyCreditDetails";
import { JSX, Suspense } from "react";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { PenaltyCreditHistory } from "./PenaltyCreditHistory";
import { getUserInfo } from "@/auth";
import { getPenaltyCredit, getPenaltyCreditHistories } from "../data";
import { PenaltyCreditStatus, Role } from "@/prisma/generated/enums";
import { AnalystActions } from "./AnalystActions";
import { DirectorActions } from "./DirectorActions";
import { getIsoYmdString } from "@/app/lib/utils/date";

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

  const histories = await getPenaltyCreditHistories(penaltyCreditId);
  let statusBanner: JSX.Element | null = null;
  if (userIsGov) {
    if (status === PenaltyCreditStatus.DRAFT) {
      const history = histories.findLast(
        (h) => h.userAction === PenaltyCreditStatus.DRAFT,
      );
      if (history) {
        statusBanner = (
          <StatusBanner
            title="STATUS - Draft."
            primaryText={`Penalty Credit ID ${penaltyCreditId} saved ${getIsoYmdString(history.timestamp)} by ${history.user.firstName} ${history.user.lastName}.`}
          />
        );
      }
    } else if (status === PenaltyCreditStatus.SUBMITTED_TO_DIRECTOR) {
      const history = histories.findLast(
        (h) => h.userAction === PenaltyCreditStatus.SUBMITTED_TO_DIRECTOR,
      );
      if (history) {
        statusBanner = (
          <StatusBanner
            title="STATUS: Submitted to Director."
            primaryText={`Penalty Credit ID ${penaltyCreditId} submitted to Director ${getIsoYmdString(history.timestamp)} by ${history.user.firstName} ${history.user.lastName}.`}
          />
        );
      }
    } else if (status === PenaltyCreditStatus.RETURNED_TO_ANALYST) {
      const history = histories.findLast(
        (h) => h.userAction === PenaltyCreditStatus.RETURNED_TO_ANALYST,
      );
      if (history) {
        statusBanner = (
          <StatusBanner
            title="STATUS: Returned."
            primaryText={`Penalty Credit ID ${penaltyCreditId} returned ${getIsoYmdString(history.timestamp)} by the Director.`}
          />
        );
      }
    } else if (status === PenaltyCreditStatus.APPROVED) {
      const history = histories.findLast(
        (h) => h.userAction === PenaltyCreditStatus.APPROVED,
      );
      if (history) {
        statusBanner = (
          <StatusBanner
            variant="success"
            title="STATUS: Approved."
            primaryText={`Penalty Credit ID ${penaltyCreditId} approved ${getIsoYmdString(history.timestamp)} by the Director.`}
          />
        );
      }
    }
  } else if (status === PenaltyCreditStatus.APPROVED) {
    const history = histories.findLast(
      (h) => h.userAction === PenaltyCreditStatus.APPROVED,
    );
    if (history) {
      statusBanner = (
        <StatusBanner
          variant="success"
          title="STATUS - Approved."
          primaryText={`Penalty Credit ID ${penaltyCreditId} approved ${getIsoYmdString(history.timestamp)} by Government of B.C.`}
        />
      );
    }
  }

  return (
    <div>
      {statusBanner}
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
