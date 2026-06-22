import { JSX, Suspense } from "react";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { ContentCard, StatusBanner, Breadcrumbs } from "@/app/lib/components";
import { getUserInfo } from "@/auth";
import { TransferToActions } from "./TransferToActions";
import { CreditTransferStatus, Role } from "@/prisma/generated/enums";
import { DirectorActions } from "./DirectorActions";
import { AnalystActions } from "./AnalystActions";
import { transferFromSupplierRescindableStatuses, mapOfStatusToSupplierStatus } from "../constants";
import { getCreditTransfer, getProjectedBalanceAfterTransfer } from "../data";
import {
  getCreditTransferStatusEnumsToStringsMap,
  getModelYearEnumsToStringsMap,
  getVehicleClassEnumsToStringsMap,
  getZevClassEnumsToStringsMap,
} from "@/app/lib/utils/enumMaps";
import { Routes } from "@/app/lib/constants";
import { DraftTransferReview } from "./DraftTransferReview";
import { PrintDownloadPageButton } from "./PrintDownloadPageButton";
import Decimal from "decimal.js";

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
  const vehicleClassesMap = getVehicleClassEnumsToStringsMap();
  const zevClassesMap = getZevClassEnumsToStringsMap();
  const modelYearsMap = getModelYearEnumsToStringsMap();

  const statusLabel = statusMap[status] ?? String(status);
  const isDraft =
    !userIsGov &&
    userOrgId === transfer.transferFromId &&
    status === CreditTransferStatus.DRAFT;

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

  let actionComponent: JSX.Element | null = null;
  if (
    !userIsGov &&
    userOrgId === transfer.transferToId &&
    status === CreditTransferStatus.SUBMITTED_TO_TRANSFER_TO
  ) {
    actionComponent = (
      <TransferToActions
        id={id}
        transferToSupplierName={transfer.transferTo.name}
      />
    );
  } else if (userIsGov && userRoles.includes(Role.DIRECTOR)) {
    actionComponent = <DirectorActions id={id} status={status} />;
  } else if (userIsGov && userRoles.includes(Role.ZEVA_IDIR_USER)) {
    actionComponent = <AnalystActions id={id} status={status} />;
  } else if (
    !userIsGov &&
    userOrgId === transfer.transferFromId &&
    transferFromSupplierRescindableStatuses.includes(transfer.status)
  ) {
    actionComponent = null;
  }

  return (
    <div className="p-4">
      <Breadcrumbs
        items={[
          { label: "Compliance Transactions", href: Routes.CreditTransfers },
          { label: "New Credit Transfer" },
        ]}
      />

      <h1 className="mb-4 mt-2 text-2xl font-bold text-primaryText">
        Create New Credit Transfer
      </h1>

      <div className="mb-4">
        <StatusBanner title={statusLabel} primaryText={`STATUS - ${statusLabel}.`} />
      </div>

      <div className="mb-4 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-level-1">
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <h2 className="text-xl font-semibold text-primaryText">
            Credit Transfer ID {id}
          </h2>
          <PrintDownloadPageButton />
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="mb-3 text-base font-semibold text-primaryText">
              Transfer Details
            </h3>
            <p className="text-sm text-primaryText">
              <span className="font-medium">Transfer From:</span>{" "}
              <span className="font-bold">{transfer.transferFrom.name}</span>
              {"   "}
              <span className="font-medium">Transfer To:</span>{" "}
              <span className="font-bold">{transfer.transferTo.name}</span>
              {"   "}
              <span className="font-medium">ID:</span>{" "}
              <span className="font-bold">{id}</span>
            </p>
          </div>

          <div className="mb-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-300 bg-gray-50">
                  <th className="py-3 pr-4 text-left font-semibold text-primaryText">
                    Vehicle Class
                  </th>
                  <th className="py-3 pr-4 text-left font-semibold text-primaryText">
                    ZEV Class
                  </th>
                  <th className="py-3 pr-4 text-left font-semibold text-primaryText">
                    Model Year
                  </th>
                  <th className="py-3 pr-4 text-left font-semibold text-primaryText">
                    Number of Units
                  </th>
                  <th className="py-3 text-left font-semibold text-primaryText">
                    Dollar per Value Unit
                  </th>
                </tr>
              </thead>
              <tbody>
                {transfer.creditTransferContent.map((content) => (
                  <tr key={content.id} className="border-b border-gray-100">
                    <td className="py-3 pr-4 text-primaryText">
                      {vehicleClassesMap[content.vehicleClass]}
                    </td>
                    <td className="py-3 pr-4 text-primaryText">
                      {zevClassesMap[content.zevClass]}
                    </td>
                    <td className="py-3 pr-4 text-primaryText">
                      {modelYearsMap[content.modelYear]}
                    </td>
                    <td className="py-3 pr-4 text-primaryText">
                      {content.numberOfUnits.toString()}
                    </td>
                    <td className="py-3 text-primaryText">
                      {content.dollarValuePerUnit.toString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-sm font-semibold text-primaryText">
            Total CAD:{" "}
            <span className="font-bold">
              ${" "}
              {new Intl.NumberFormat("en-CA", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(totalCAD.toNumber())}
            </span>
          </p>
        </div>
      </div>

      {projectedBalance && (
        <div className="mb-4 w-72 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-level-1">
          <div className="border-b border-gray-200 bg-gray-100 px-6 py-3">
            <span className="font-semibold text-primaryText">
              Credit Balance After Transfer
            </span>
          </div>
          <div className="p-6">
            <div className="flex justify-between py-1 text-sm">
              <span className="font-medium text-primaryText">Category A:</span>
              <span className="font-bold text-primaryText">
                {projectedBalance.A}
              </span>
            </div>
            <div className="flex justify-between py-1 text-sm">
              <span className="font-medium text-primaryText">Category B:</span>
              <span className="font-bold text-primaryText">
                {projectedBalance.B}
              </span>
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

      {!isDraft && actionComponent && (
        <ContentCard title="Actions">
          <Suspense fallback={<LoadingSkeleton />}>{actionComponent}</Suspense>
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
  );
};

const RescindableActions = async (props: {
  id: number;
  transferFromSupplierName: string;
}) => {
  const { TransferFromActions } = await import("./TransferFromActions");
  return (
    <ContentCard title="Actions">
      <TransferFromActions
        id={props.id}
        type="rescindable"
        transferFromSupplierName={props.transferFromSupplierName}
      />
    </ContentCard>
  );
};

