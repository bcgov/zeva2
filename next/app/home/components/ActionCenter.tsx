import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faCircleExclamation,
  faCoins,
  faHourglassHalf,
  faListCheck,
} from "@fortawesome/free-solid-svg-icons";
import { getUserInfo } from "@/auth";
import { Routes } from "@/app/lib/constants";
import { getReportableBalanceAB } from "@/app/zev-unit-activities/lib/zev-unit-transactions/data";
import {
  getSupplierActionRequiredCounts,
  getSupplierAwarenessCounts,
  getSupplierInProgressCounts,
} from "../lib/services";
import { DashboardTone, dashboardToneClasses } from "../lib/constants";
import { getAllRecordsViewRouteSupplier } from "../lib/utils";
import { ItemsPanel } from "./ItemsPanel";
import { getActiveNotifications } from "@/app/notifications/lib/services";
import { NotificationMessageBanner } from "@/app/notifications/lib/components/NotificationMessageBanner";
import { Fragment } from "react/jsx-runtime";

const sumCounts = (counts: Record<string, number>) =>
  Object.values(counts).reduce((sum, count) => sum + count, 0);

// for suppliers
export const ActionCenter = async () => {
  const { userOrgId } = await getUserInfo();
  const [
    actionRequiredCounts,
    inProgressCounts,
    awarenessCounts,
    activeNotifications,
    balance,
  ] = await Promise.all([
    getSupplierActionRequiredCounts(userOrgId),
    getSupplierInProgressCounts(userOrgId),
    getSupplierAwarenessCounts(userOrgId),
    getActiveNotifications(userOrgId),
    getReportableBalanceAB(userOrgId),
  ]);

  const actionRequiredTotal = sumCounts(actionRequiredCounts);
  const inProgressTotal = sumCounts(inProgressCounts);
  const awarenessTotal = sumCounts(awarenessCounts);

  const summaryCards: {
    label: string;
    count: number;
    icon: typeof faListCheck;
    tone?: DashboardTone;
    viewAllRoute: string;
  }[] = [
    {
      label: "All Items",
      count: actionRequiredTotal + inProgressTotal + awarenessTotal,
      icon: faListCheck,
      viewAllRoute: getAllRecordsViewRouteSupplier("all"),
    },
    {
      label: "Action Required",
      count: actionRequiredTotal,
      icon: faCircleExclamation,
      tone: "error",
      viewAllRoute: getAllRecordsViewRouteSupplier("requires-your-action"),
    },
    {
      label: "In Progress",
      count: inProgressTotal,
      icon: faHourglassHalf,
      tone: "warning",
      viewAllRoute: getAllRecordsViewRouteSupplier("in-progress"),
    },
    {
      label: "For Awareness",
      count: awarenessTotal,
      icon: faCircleCheck,
      tone: "success",
      viewAllRoute: getAllRecordsViewRouteSupplier("for-awareness"),
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-xl font-bold">Dashboard</h1>
      {activeNotifications.length > 0 && (
        <div className="flex flex-col gap-4 rounded border border-dividerMedium/40 p-4">
          <h2 className="text-lg font-bold">Notifications</h2>
          {activeNotifications.map((notification, index) => {
            return (
              <Fragment key={index}>
                <NotificationMessageBanner
                  type={notification.type}
                  title={notification.title}
                  message={notification.message}
                />
              </Fragment>
            );
          })}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {summaryCards.map((card) => {
          const tone = card.tone ? dashboardToneClasses[card.tone] : undefined;
          return (
            <div
              key={card.label}
              className={`flex flex-row items-center gap-4 rounded border px-5 py-4 ${
                tone
                  ? `${tone.border} ${tone.bg}`
                  : "border-dividerDark/60 bg-lightGrey"
              }`}
            >
              <FontAwesomeIcon
                icon={card.icon}
                className={`h-8 w-8 ${tone ? tone.text : "text-primaryIcon"}`}
              />
              <div className="flex flex-col gap-0.5">
                <span className={`text-lg font-bold ${tone ? tone.text : ""}`}>
                  {card.count} Items
                </span>
                <span className="text-sm font-bold text-secondaryText">
                  {card.label}
                </span>
                <Link
                  href={card.viewAllRoute}
                  className="text-xs text-link underline"
                >
                  View all
                </Link>
              </div>
            </div>
          );
        })}
        <div className="flex flex-row items-center gap-4 rounded border border-dividerDark/60 bg-lightGrey px-5 py-4">
          <FontAwesomeIcon
            icon={faCoins}
            className="h-8 w-8 text-primaryIcon"
          />
          <div className="flex flex-col gap-2">
            <Link
              href={Routes.ZevUnitTransactions}
              className="font-bold text-link"
            >
              Your <span className="underline">Credit Balance</span>
            </Link>
            {balance === "deficit" ? (
              <span className="font-bold">Deficit</span>
            ) : (
              <div className="flex flex-row gap-4">
                <span>
                  <span className="font-bold">A </span>
                  <span className="font-bold">{balance.A}</span>
                </span>
                <span>
                  <span className="font-bold">B </span>
                  <span className="font-bold">{balance.B}</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      <ItemsPanel
        title="Requires Your Action"
        countsMap={actionRequiredCounts}
        viewAllRoute={getAllRecordsViewRouteSupplier("requires-your-action")}
      />
      <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
        <ItemsPanel
          title="In Progress"
          countsMap={inProgressCounts}
          viewAllRoute={getAllRecordsViewRouteSupplier("in-progress")}
        />
        <ItemsPanel
          title="For Awareness"
          countsMap={awarenessCounts}
          viewAllRoute={getAllRecordsViewRouteSupplier("for-awareness")}
        />
      </div>
    </div>
  );
};
