import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faCircleExclamation,
  faCircleInfo,
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
import { getSupplierRecords } from "../lib/services";
import { DashboardSectionPanel } from "./DashboardSectionPanel";
import { ActiveNotificationsDisplay } from "./ActiveNotificationsDisplay";

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
        <div className="flex flex-col gap-6">
          <ActiveNotificationsDisplay notifications={activeNotifications} />
          <hr className="border-dashboardDivider"></hr>
        </div>
      )}
      <h2 className="text-xl font-bold">Dashboard</h2>
      <div className="grid grid-cols-5 gap-4">
        {summaryCards.map((card) => {
          const tone = card.tone ? dashboardToneClasses[card.tone] : undefined;
          return (
            <div
              key={card.label}
              className={`flex flex-row items-center gap-6 rounded border pl-4 pr-6 py-4 ${
                tone
                  ? `${tone.border} ${tone.bg}`
                  : "border-dividerDark/60 bg-lightGrey"
              }`}
            >
              <FontAwesomeIcon
                icon={card.icon}
                className={`text-[40px] ${tone ? tone.text : "text-primaryIcon"}`}
              />
              <div className="flex flex-col gap-1">
                <span className={`text-xl font-bold ${tone ? tone.text : ""}`}>
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
        <div className="flex flex-row items-center gap-6 rounded border border-dividerDark/60 bg-lightGrey px-6 py-4">
          <FontAwesomeIcon
            icon={faCoins}
            className="text-[40px] text-primaryIcon"
          />
          <div className="flex flex-col gap-4">
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
                  <span className="font-bold">A: </span>
                  <span className="font-bold">{balance.A}</span>
                </span>
                <span>
                  <span className="font-bold">B: </span>
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
      <hr className="border-dashboardDivider"></hr>
      <div className="flex flex-row items-center gap-6 bg-infoBG px-6 py-4">
        <FontAwesomeIcon
          icon={faCircleInfo}
          className="text-[40px] text-primaryBlueHover"
        />
        <div className="flex flex-row gap-6">
          <div className="flex flex-col gap-2">
            <span className="font-bold">
              Need assistance? We're here to help.
            </span>
            <span>Contact the ZEVA team or learn more about the program.</span>
          </div>
          <div className="border border-dividerMedium"></div>
          <div className="flex flex-col gap-2">
            <span>
              Email:{" "}
              <a
                href="mailto:ZEVRegulation@gov.bc.ca"
                className="text-link underline cursor-pointer"
              >
                ZEVRegulation@gov.bc.ca
              </a>
            </span>
            <span>
              Learn more:{" "}
              <a
                href="https://www.bclaws.gov.bc.ca/civix/content/complete/statreg/28270709/904186779/?xsl=/templates/browse.xsl"
                className="text-link underline cursor-pointer"
              >
                Zero-Emission Vehicles Act
              </a>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
