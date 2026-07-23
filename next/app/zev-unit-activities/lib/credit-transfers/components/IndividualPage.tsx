import { JSX, Suspense } from "react";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { ContentCard, StatusBanner } from "@/app/lib/components";
import { getUserInfo } from "@/auth";
import { TransferToActions } from "./TransferToActions";
import { CreditTransferStatus, Role } from "@/prisma/generated/enums";
import { DirectorActions } from "./DirectorActions";
import { AnalystActions } from "./AnalystActions";
import {
  transferFromSupplierRescindableStatuses,
  mapOfStatusToSupplierStatus,
} from "../constants";
import { getCreditTransfer, getProjectedBalanceAfterTransfer } from "../data";
import {
  getCreditTransferStatusEnumsToStringsMap,
  getModelYearEnumsToStringsMap,
  getVehicleClassEnumsToStringsMap,
  getZevClassEnumsToStringsMap,
} from "@/app/lib/utils/enumMaps";
import { DraftTransferReview } from "./DraftTransferReview";
import { PrintDownloadPageButton } from "./PrintDownloadPageButton";
import Decimal from "decimal.js";
import { getIsoYmdString, getTimeWithTz } from "@/app/lib/utils/date";

export const IndividualPage = async (props: { id: string }) => {
  const id = Number.parseInt(props.id, 10);
  const { userIsGov, userOrgId, userRoles } = await getUserInfo();
  const transfer = await getCreditTransfer(id);
  if (!transfer) {
    return null;
  }

  let status = transfer.status;
  if (!userIsGov) {
    status = mapOfStatusToSupplierStatus[status];
  }

  const statusMap = getCreditTransferStatusEnumsToStringsMap();

  const statusLabelOverrides: Partial<Record<CreditTransferStatus, string>> = {
    [CreditTransferStatus.SUBMITTED_TO_TRANSFER_TO]: "Submitted To Transfer Partner",
    [CreditTransferStatus.APPROVED_BY_TRANSFER_TO]: "Submitted to Government",
    [CreditTransferStatus.APPROVED_BY_GOV]: "Approved",
  };
  const statusLabel = statusLabelOverrides[status] ?? statusMap[status] ?? String(status);

  const fromName = transfer.transferFrom.name;
  const toName = transfer.transferTo.name;
  const ctLabel = `Credit Transfer ${id}`;

  const formatHistoryDate = (d: Date) =>
    d.toLocaleDateString("en-CA", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "America/Vancouver",
    });

  const submissionEntry = transfer.creditTransferHistory.find(
    (entry) => entry.userAction === CreditTransferStatus.SUBMITTED_TO_TRANSFER_TO,
  );
  const submissionDate = submissionEntry?.timestamp
    ? formatHistoryDate(submissionEntry.timestamp)
    : null;

  const approvedByTransferToEntry = transfer.creditTransferHistory.find(
    (entry) => entry.userAction === CreditTransferStatus.APPROVED_BY_TRANSFER_TO,
  );
  const approvedByTransferToDate = approvedByTransferToEntry?.timestamp
    ? formatHistoryDate(approvedByTransferToEntry.timestamp)
    : null;

  const approvedByGovEntry = transfer.creditTransferHistory.find(
    (entry) => entry.userAction === CreditTransferStatus.APPROVED_BY_GOV,
  );
  const approvedByGovDate = approvedByGovEntry?.timestamp
    ? formatHistoryDate(approvedByGovEntry.timestamp)
    : null;

  let statusPrimaryText: string;
  switch (transfer.status) {
    case CreditTransferStatus.DRAFT:
      statusPrimaryText = "";
      break;
    case CreditTransferStatus.SUBMITTED_TO_TRANSFER_TO:
      statusPrimaryText =
        !userIsGov && userOrgId === transfer.transferToId
          ? `CT ID ${id}${submissionDate ? ` submitted ${submissionDate}` : ""} by ${fromName}, requires your review and acceptance.`
          : `CT ID ${id}${submissionDate ? ` submitted ${submissionDate}` : ""} by ${fromName}, awaiting ${toName} acceptance.`;
      break;
    case CreditTransferStatus.APPROVED_BY_TRANSFER_TO:
      statusPrimaryText = `CT ID ${id}${approvedByTransferToDate ? ` submitted to the Government of B.C. ${approvedByTransferToDate}` : ""}, awaiting government review.`;
      break;
    case CreditTransferStatus.RECOMMEND_APPROVAL_GOV:
      statusPrimaryText = `${ctLabel} has been recommended for approval by an analyst and is awaiting the director's decision.`;
      break;
    case CreditTransferStatus.RECOMMEND_REJECTION_GOV:
      statusPrimaryText = `${ctLabel} has been recommended for rejection by an analyst and is awaiting the director's decision.`;
      break;
    case CreditTransferStatus.RETURNED_TO_ANALYST:
      statusPrimaryText = `${ctLabel} has been returned to the analyst for further review.`;
      break;
    case CreditTransferStatus.APPROVED_BY_GOV:
      statusPrimaryText = `CT ID ${id}${approvedByGovDate ? ` recorded ${approvedByGovDate}` : ""} by the Government of B.C., credit balances have been adjusted.`;
      break;
    case CreditTransferStatus.REJECTED_BY_GOV:
      statusPrimaryText = `${ctLabel} was rejected by the government.`;
      break;
    case CreditTransferStatus.REJECTED_BY_TRANSFER_TO:
      statusPrimaryText = `${ctLabel} was rejected by ${toName}.`;
      break;
    case CreditTransferStatus.RESCINDED_BY_TRANSFER_FROM:
      statusPrimaryText = `${ctLabel} was rescinded by ${fromName}.`;
      break;
    default:
      statusPrimaryText = `${ctLabel} is currently ${statusLabel.toLowerCase()}.`;
  }

  const isDraft =
    !userIsGov &&
    userOrgId === transfer.transferFromId &&
    status === CreditTransferStatus.DRAFT;

  const transferFromStatements = [
    `I confirm that I am an officer or employee of ${transfer.transferFrom.name}, and that records evidencing my authority to submit this notice are available on request.`,
    `${transfer.transferFrom.name} certifies that the information provided in this notice is accurate and complete.`,
    `${transfer.transferFrom.name} consents to the transfer of credits in this notice.`,
  ];

  const transferToStatements = [
    `I confirm that I am an officer or employee of ${transfer.transferTo.name}, and that records evidencing my authority to submit this notice are available on request.`,
    `${transfer.transferTo.name} certifies that the information provided in this notice is accurate and complete.`,
    `${transfer.transferTo.name} consents to the transfer of credits in this notice.`,
  ];

  const signingSections = [
    {
      title: `${transfer.transferFrom.name} (Transfer From)`,
      signed: Boolean(transfer.transferFromStatement),
      orgId: transfer.transferFromId,
      statements: transferFromStatements,
    },
    {
      title: `${transfer.transferTo.name} (Transfer To)`,
      signed: Boolean(transfer.transferToStatement),
      orgId: transfer.transferToId,
      statements: transferToStatements,
    },
  ];

  const visibleSigningSections = signingSections.filter(
    (section) => section.signed && (userIsGov || section.orgId === userOrgId),
  );

  const signingInfo: { label: string; timestamp: Date }[] = [];
  for (const entry of transfer.creditTransferHistory) {
    if (entry.userAction === CreditTransferStatus.SUBMITTED_TO_TRANSFER_TO) {
      signingInfo.push({
        label: `Signed and submitted by ${transfer.transferFrom.name}`,
        timestamp: entry.timestamp,
      });
    } else if (
      entry.userAction === CreditTransferStatus.APPROVED_BY_TRANSFER_TO
    ) {
      signingInfo.push({
        label: `Signed and submitted by ${transfer.transferTo.name}`,
        timestamp: entry.timestamp,
      });
    }
  }

  let totalCAD = new Decimal(0);
  for (const content of transfer.creditTransferContent) {
    totalCAD = totalCAD.plus(
      content.numberOfUnits.times(content.dollarValuePerUnit),
    );
  }

  let projectedBalance: { A: string; B: string } | null = null;
  if (isDraft) {
    projectedBalance = await getProjectedBalanceAfterTransfer(id);
  }

  const isTransferToAction =
    !userIsGov &&
    userOrgId === transfer.transferToId &&
    status === CreditTransferStatus.SUBMITTED_TO_TRANSFER_TO;

  let actionComponent: JSX.Element | null = null;
  if (userIsGov && userRoles.includes(Role.DIRECTOR)) {
    actionComponent = <DirectorActions id={id} status={status} />;
  } else if (userIsGov && userRoles.includes(Role.ZEVA_IDIR_USER)) {
    actionComponent = <AnalystActions id={id} status={status} />;
  }

  const vehicleClassMap = getVehicleClassEnumsToStringsMap();
  const zevClassMap = getZevClassEnumsToStringsMap();
  const modelYearsMap = getModelYearEnumsToStringsMap();

  return (
    <div className="flex self-stretch flex-col items-start gap-4">
      <div className="flex flex-col items-start gap-6 self-stretch">
        <div className="flex flex-col items-start self-stretch">
          <div className="flex self-stretch h-20 p-5 justify-between items-center rounded-t border border-dividerMedium bg-[#E7E7E7]">
            <div className="text-black text-2xl font-bold leading-[34px]">
              Credit Transfer ID {id}
            </div>
            <div className="flex h-10 items-center justify-center gap-2 py-[5px]">
              <PrintDownloadPageButton />
            </div>
          </div>
          <div className="flex items-start self-stretch gap-3 py-3 bg-white">
            <StatusBanner
              title={`STATUS - ${statusLabel}.`}
              primaryText={statusPrimaryText}
              className="w-full"
            />
          </div>
          <div className="flex flex-col items-start self-stretch rounded border border-dividerMedium shadow-[0_4px_20px_0_rgba(177,177,177,0.10)]">
            <div className="flex flex-col items-start self-stretch rounded-t px-5 py-4 gap-1 bg-disabledSurface">
              <div className="self-stretch text-black text-xl font-bold leading-7">
                Transfer Details
              </div>
            </div>
            <div className="flex flex-col items-start self-stretch gap-5 p-5 rounded shadow-[0_4px_20px_0_rgba(177,177,177,0.10)]">
              <div className="flex flex-col items-start gap-3 self-stretch">
                <div className="flex w-[1091px] items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="text-secondaryText text-lg font-normal leading-6">
                      Transfer From:
                    </div>
                    <div className="text-black text-lg font-bold leading-6">
                      {transfer.transferFrom.name}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-secondaryText text-lg font-normal leading-6">
                      Transfer To:
                    </div>
                    <div className="text-black text-lg font-bold leading-6">
                      {transfer.transferTo.name}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-secondaryText text-lg font-normal leading-6">
                      ID:
                    </div>
                    <div className="text-black text-lg font-bold leading-6">
                      {id}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="self-stretch h-px bg-dividerMedium"></div>
            <div className="flex self-stretch flex-col gap-5 px-5 py-6">
              <div className="w-full overflow-hidden rounded border border-dividerMedium">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="h-[60px] border-b border-dividerMedium bg-white">
                      <th className="px-4 text-left font-bold leading-6 text-primaryText">
                        Vehicle Class
                      </th>
                      <th className="px-4 text-left font-bold leading-6 text-primaryText">
                        ZEV Class
                      </th>
                      <th className="px-4 text-left font-bold leading-6 text-primaryText">
                        Model Year
                      </th>
                      <th className="px-4 text-left font-bold leading-6 text-primaryText">
                        Number of Units
                      </th>
                      <th className="px-4 text-left font-bold leading-6 text-primaryText">
                        Dollar per Value Unit
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {transfer.creditTransferContent.map((content) => (
                      <tr
                        key={crypto.randomUUID()}
                        className="h-[60px] border-b border-dividerMedium last:border-b-0 even:bg-white odd:bg-lightGrey"
                      >
                        <td className="px-4 text-left font-normal leading-6 text-primaryText">
                          {vehicleClassMap[content.vehicleClass]}
                        </td>
                        <td className="px-4 text-left font-normal leading-6 text-primaryText">
                          {zevClassMap[content.zevClass]}
                        </td>
                        <td className="px-4 text-left font-normal leading-6 text-primaryText">
                          {modelYearsMap[content.modelYear]}
                        </td>
                        <td className="px-4 text-left font-normal leading-6 text-primaryText">
                          {content.numberOfUnits.toString()}
                        </td>
                        <td className="px-4 text-left font-normal leading-6 text-primaryText">
                          {content.dollarValuePerUnit.toString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex flex-col items-start self-stretch gap-5 p-5 rounded-b border-t border-dividerMedium shadow-[0_4px_20px_0_rgba(177,177,177,0.10)]">
              <div className="flex flex-col items-start gap-3 self-stretch">
                <div className="flex self-stretch items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="text-secondaryText text-lg font-normal leading-6">
                      Total CAD:{" "}
                    </div>
                    <div className="text-black text-lg font-bold leading-6">
                      {new Intl.NumberFormat("en-CA", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }).format(totalCAD.toNumber())}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {projectedBalance && (
          <div className="flex w-[452px] flex-col items-start gap-5 pb-5 rounded border border-dividerMedium shadow-[0_4px_20px_0_rgba(177,177,177,0.10)]">
            <div className="flex flex-col items-start gap-3 self-stretch">
              <div className="flex flex-col items-start gap-2 self-stretch p-5 rounded-t bg-disabledSurface">
                <div className="self-stretch text-black text-xl font-bold leading-7">
                  Credit Balance After Transfer
                </div>
              </div>
              <div className="flex flex-col items-start gap-3 self-stretch px-5">
                <div className="flex items-center gap-4 self-stretch">
                  <div className="text-secondaryText font-bold leading-6">
                    Category A:
                  </div>
                  <div className="self-stretch text-black text-lg font-bold leading-[27px]">
                    {projectedBalance.A}
                  </div>
                </div>
                <div className="self-stretch h-px bg-disabledSurface"></div>
                <div className="flex items-center gap-4 self-stretch">
                  <div className="text-secondaryText font-bold leading-6">
                    Category B:
                  </div>
                  <div className="self-stretch text-black text-lg font-bold leading-[27px]">
                    {projectedBalance.B}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {isDraft && (
          <Suspense fallback={<LoadingSkeleton />}>
            <DraftTransferReview
              id={id}
              transferFromSupplierName={transfer.transferFrom.name}
            />
          </Suspense>
        )}

        {!isDraft && visibleSigningSections.length > 0 && (
          <div className="flex self-stretch flex-col items-start rounded border border-dividerMedium">
            <div className="flex p-5 flex-col items-start gap-2 self-stretch rounded-t border-b border-dividerMedium bg-disabledSurface">
              <div className="self-stretch text-primaryText text-xl font-bold leading-7">
                Review &amp; Confirm
              </div>
            </div>
            <div className="flex p-5 flex-col items-start gap-5 rounded shadow-[0_4px_20px_0_rgba(177,177,177,0.10)] self-stretch">
              <div className="flex self-stretch flex-col items-start gap-6">
                {visibleSigningSections.map((section) => (
                  <div
                    key={section.title}
                    className="flex self-stretch flex-col items-start gap-4"
                  >
                    <div className="self-stretch text-secondaryText font-bold leading-6">
                      {section.title}
                    </div>
                    <div className="flex self-stretch flex-col items-start gap-4">
                      {section.statements.map((statement) => (
                        <div
                          key={`${section.title}-${statement}`}
                          className="self-stretch text-black font-normal leading-6"
                        >
                          {statement}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!isDraft && signingInfo.length > 0 && (
          <div className="flex self-stretch flex-col items-start rounded border border-dividerMedium">
            <div className="flex p-5 flex-col items-start gap-2 self-stretch rounded-t border-b border-dividerMedium bg-disabledSurface">
              <div className="self-stretch text-primaryText text-xl font-bold leading-7">
                Signing Information
              </div>
            </div>
            <div className="flex p-5 flex-col items-start gap-3 rounded shadow-[0_4px_20px_0_rgba(177,177,177,0.10)] self-stretch">
              {signingInfo.map((info) => (
                <div
                  key={info.label}
                  className="self-stretch text-black font-normal leading-6"
                >
                  {info.label} {getIsoYmdString(info.timestamp)}{" "}
                  {getTimeWithTz(info.timestamp)}
                </div>
              ))}
            </div>
          </div>
        )}

        {isTransferToAction && (
          <Suspense fallback={<LoadingSkeleton />}>
            <TransferToActions
              id={id}
              transferToSupplierName={transfer.transferTo.name}
            />
          </Suspense>
        )}

        {!isDraft && actionComponent && (
          <ContentCard title="Actions">
            <Suspense fallback={<LoadingSkeleton />}>
              {actionComponent}
            </Suspense>
          </ContentCard>
        )}

        {!userIsGov &&
          userOrgId === transfer.transferFromId &&
          !isDraft &&
          transferFromSupplierRescindableStatuses.includes(transfer.status) && (
            <Suspense fallback={<LoadingSkeleton />}>
              <RescindableActions
                id={id}
                transferFromSupplierName={transfer.transferFrom.name}
              />
            </Suspense>
          )}
      </div>
    </div>
  );
};

const RescindableActions = async (props: {
  id: number;
  transferFromSupplierName: string;
}) => {
  const { TransferFromActions } = await import("./TransferFromActions");
  return (
    <TransferFromActions
      id={props.id}
      type="rescindable"
      transferFromSupplierName={props.transferFromSupplierName}
    />
  );
};
