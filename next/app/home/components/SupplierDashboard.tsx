import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faCircleExclamation,
  faCoins,
  faHourglassHalf,
  faListCheck,
  IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import { getUserInfo } from "@/auth";
import { Routes } from "@/app/lib/constants";
import { getReportableBalanceAB } from "@/app/zev-unit-activities/lib/zev-unit-transactions/data";
import { DashboardTone, dashboardToneClasses } from "../lib/constants";
import { getAllRecordsViewRouteSupplier } from "../lib/utils";
import { getActiveNotifications } from "@/app/notifications/lib/services";
import { NotificationMessageBanner } from "@/app/notifications/lib/components/NotificationMessageBanner";
import { Fragment } from "react/jsx-runtime";
import { getSupplierRecords } from "../lib/services";
import { DashboardSectionPanel } from "./DashboardSectionPanel";

// for suppliers
export const SupplierDashboard = async () => {
  const { userOrgId } = await getUserInfo();
  const [
    activeNotifications,
    balance,
    requiresActionRecords,
    inProgressRecords,
    awarenessRecords,
  ] = await Promise.all([
    getActiveNotifications(userOrgId),
    getReportableBalanceAB(userOrgId),
    getSupplierRecords(userOrgId, "requires-your-action"),
    getSupplierRecords(userOrgId, "in-progress"),
    getSupplierRecords(userOrgId, "for-awareness"),
  ]);

  const summaryCards: {
    label: string;
    count: number;
    icon: IconDefinition;
    tone?: DashboardTone;
    viewAllRoute: string;
  }[] = [
    {
      label: "All Items",
      count:
        requiresActionRecords.length +
        inProgressRecords.length +
        awarenessRecords.length,
      icon: faListCheck,
      viewAllRoute: getAllRecordsViewRouteSupplier("all"),
    },
    {
      label: "Action Required",
      count: requiresActionRecords.length,
      icon: faCircleExclamation,
      tone: "error",
      viewAllRoute: getAllRecordsViewRouteSupplier("requires-your-action"),
    },
    {
      label: "In Progress",
      count: inProgressRecords.length,
      icon: faHourglassHalf,
      tone: "warning",
      viewAllRoute: getAllRecordsViewRouteSupplier("in-progress"),
    },
    {
      label: "For Awareness",
      count: awarenessRecords.length,
      icon: faCircleCheck,
      tone: "success",
      viewAllRoute: getAllRecordsViewRouteSupplier("for-awareness"),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {activeNotifications.length > 0 && (
        <div className="flex flex-col gap-4 rounded border border-dividerMedium/40 p-4">
          <h2 className="text-lg font-bold">
            Notifications ({activeNotifications.length})
          </h2>
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
      <hr className="border-dividerMedium"></hr>
      <h1 className="text-xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-5 gap-4">
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
      <DashboardSectionPanel
        title="Requires Your Action"
        tone="error"
        records={requiresActionRecords}
        viewAllRoute={getAllRecordsViewRouteSupplier("requires-your-action")}
      />
      <div className="grid grid-cols-2 gap-6">
        <DashboardSectionPanel
          title="In Progress"
          tone="warning"
          records={inProgressRecords}
          viewAllRoute={getAllRecordsViewRouteSupplier("in-progress")}
        />
        <DashboardSectionPanel
          title="For Awareness"
          tone="success"
          records={awarenessRecords}
          viewAllRoute={getAllRecordsViewRouteSupplier("for-awareness")}
        />
      </div>
      <hr className="border-dividerMedium"></hr>
    </div>
  );
};
