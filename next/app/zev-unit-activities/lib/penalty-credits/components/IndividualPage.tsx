import { JSX } from "react";
import { StatusBanner } from "@/app/lib/components";
import { BackButton } from "@/app/lib/components/BackButton";
import { PrintDownloadPageButton } from "../../credit-transfers/components/PrintDownloadPageButton";
import { PenaltyCreditDetails } from "./PenaltyCreditDetails";
import { getUserInfo } from "@/auth";
import { getPenaltyCredit, getPenaltyCreditHistories } from "../data";
import { PenaltyCreditStatus, Role } from "@/prisma/generated/enums";
import { AnalystActions } from "./AnalystActions";
import { DirectorActions } from "./DirectorActions";
import { getIsoYmdString } from "@/app/lib/utils/date";

export const IndividualPage = async ({ id }: { id: string }) => {
  const penaltyCreditId = Number.parseInt(id, 10);
  const [{ userIsGov, userRoles }, penaltyCredit, histories] =
    await Promise.all([
      getUserInfo(),
      getPenaltyCredit(penaltyCreditId),
      getPenaltyCreditHistories(penaltyCreditId),
    ]);
  if (!penaltyCredit) return null;

  const status = penaltyCredit.status;
  const history = histories
    .slice()
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .find((entry) => entry.userAction === status);
  const date = history ? getIsoYmdString(history.timestamp) : null;
  const actor = history
    ? `${history.user.firstName} ${history.user.lastName}`
    : null;

  const presentation = {
    [PenaltyCreditStatus.DRAFT]: {
      title: "STATUS - Draft.",
      variant: "draft" as const,
      text: `Penalty Credit ID ${penaltyCreditId} saved${date ? ` ${date}` : ""}${actor ? ` by ${actor}` : ""}.`,
    },
    [PenaltyCreditStatus.SUBMITTED_TO_DIRECTOR]: {
      title: "STATUS: Submitted to Director.",
      variant: "warning" as const,
      text: `${date ?? ""}${actor ? ` by ${actor}` : ""}.`.trim(),
    },
    [PenaltyCreditStatus.APPROVED]: {
      title: "STATUS: Approved.",
      variant: "success" as const,
      text: `Penalty Credit ID ${penaltyCreditId} approved${date ? ` ${date}` : ""} by ${userIsGov ? "the Director" : "Government of B.C."}.`,
    },
    [PenaltyCreditStatus.RETURNED_TO_ANALYST]: {
      title: "STATUS: Returned.",
      variant: "returned" as const,
      text: `Penalty Credit ID ${penaltyCreditId} returned${date ? ` ${date}` : ""} by the Director.`,
    },
  }[status];

  let actions: JSX.Element | null = null;
  if (
    userIsGov &&
    userRoles.includes(Role.ZEVA_IDIR_USER) &&
    (status === PenaltyCreditStatus.DRAFT ||
      status === PenaltyCreditStatus.RETURNED_TO_ANALYST)
  ) {
    actions = (
      <AnalystActions penaltyCreditId={penaltyCreditId} status={status} />
    );
  } else if (
    userIsGov &&
    userRoles.includes(Role.DIRECTOR) &&
    status === PenaltyCreditStatus.SUBMITTED_TO_DIRECTOR
  ) {
    actions = (
      <DirectorActions penaltyCreditId={penaltyCreditId} status={status} />
    );
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <header className="flex min-h-20 items-center justify-between rounded-t border border-dividerMedium bg-whisperGray p-5">
        <h1 className="text-2xl font-bold text-black">
          Penalty Credit ID {penaltyCreditId}
        </h1>
        <PrintDownloadPageButton />
      </header>
      <StatusBanner
        title={presentation.title}
        primaryText={presentation.text}
        variant={presentation.variant}
      />
      <PenaltyCreditDetails penaltyCredit={penaltyCredit} />
      {actions ?? (
        <section className="overflow-hidden rounded border border-dividerMedium bg-white">
          <h2 className="bg-disabledSurface px-5 py-4 text-xl font-bold">
            Comment (optional)
          </h2>
          <p className="p-5">{history?.comment ?? "N/A"}</p>
        </section>
      )}
      {!actions && (
        <footer className="flex min-h-20 items-center bg-gray-50 px-5">
          <BackButton />
        </footer>
      )}
    </div>
  );
};
