import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleExclamation,
  faHourglassHalf,
  faHand,
  faArrowRight,
  faUser,
  faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";
import { getUserInfo } from "@/auth";
import { Routes } from "@/app/lib/constants";
import { getGovRecords, getRecentActivityFeedRecords } from "../lib/services";
import { DashboardTone, dashboardToneClasses } from "../lib/constants";
import { DashboardSectionPanel } from "./DashboardSectionPanel";
import { GovActivityFeedPanel } from "./GovActivityFeedPanel";
import { getAllRecordsViewRouteGov } from "../lib/utils";
import { Role } from "@/prisma/generated/enums";

export const GovDashboard = async () => {
  const { userName, userRoles } = await getUserInfo();
  const [
    requiresActionRecords,
    inProgressRecords,
    withDirectorRecords,
    completedRecords,
    activityFeedRecords,
  ] = await Promise.all([
    getGovRecords(userRoles, "requires-your-action"),
    getGovRecords(userRoles, "in-progress"),
    getGovRecords(userRoles, "with-director"),
    getGovRecords(userRoles, "completed"),
    getRecentActivityFeedRecords(userRoles, 5),
  ]);

  const isDirector = userRoles.includes(Role.DIRECTOR);

  const summaryCards = [
    {
      label: "Action Required",
      count: requiresActionRecords.length,
      icon: faCircleExclamation,
      tone: "error" as DashboardTone,
      viewAllRoute: getAllRecordsViewRouteGov("requires-your-action"),
    },
    ...(isDirector
      ? []
      : [
          {
            label: "In Progress",
            count: inProgressRecords.length,
            icon: faHourglassHalf,
            tone: "warning" as DashboardTone,
            viewAllRoute: getAllRecordsViewRouteGov("in-progress"),
          },
        ]),
    ...(isDirector
      ? []
      : [
          {
            label: "With Director",
            count: withDirectorRecords.length,
            icon: faUser,
            tone: "info" as DashboardTone,
            viewAllRoute: getAllRecordsViewRouteGov("with-director"),
          },
        ]),
    {
      label: "Completed",
      count: completedRecords.length,
      icon: faCircleCheck,
      tone: "success" as DashboardTone,
      viewAllRoute: getAllRecordsViewRouteGov("completed"),
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <div className="col-span-2 flex flex-row items-center gap-5 rounded border border-dividerDark/60 bg-lightGrey px-5 py-4">
          <FontAwesomeIcon icon={faHand} className="h-8 w-8 text-primaryBlue" />
          <div className="flex flex-col gap-2">
            <span className="text-xl font-bold text-primaryBlue">
              Hello {userName}!
            </span>
            <Link
              href={`${Routes.Home}/all-records-gov?view=all`}
              className="flex flex-row items-center gap-2 font-bold text-primaryBlue underline"
            >
              View all records
              <FontAwesomeIcon
                icon={faArrowRight}
                className="h-5 w-5 text-link"
              />
            </Link>
          </div>
        </div>
        {summaryCards.map((card) => {
          const tone = dashboardToneClasses[card.tone];
          return (
            <div
              key={card.label}
              className={`flex flex-row items-center gap-4 rounded border px-5 py-4 ${tone.border} ${tone.bg}`}
            >
              <FontAwesomeIcon
                icon={card.icon}
                className={`h-6 w-6 ${tone.text}`}
              />
              <div className="flex flex-col gap-0.5">
                <span className={`text-lg font-bold ${tone.text}`}>
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
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <DashboardSectionPanel
          title="Requires Your Action"
          tone="error"
          records={requiresActionRecords}
          viewAllRoute={getAllRecordsViewRouteGov("requires-your-action")}
        />
        <GovActivityFeedPanel records={activityFeedRecords} />
      </div>
      {isDirector && (
        <DashboardSectionPanel
          title="Completed"
          tone="success"
          records={completedRecords}
          viewAllRoute={getAllRecordsViewRouteGov("completed")}
        />
      )}
      {!isDirector && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <DashboardSectionPanel
            title="In Progress"
            tone="warning"
            records={inProgressRecords}
            viewAllRoute={getAllRecordsViewRouteGov("in-progress")}
          />
          <DashboardSectionPanel
            title="With Director"
            tone="info"
            records={withDirectorRecords}
            viewAllRoute={getAllRecordsViewRouteGov("with-director")}
          />
          <DashboardSectionPanel
            title="Completed"
            tone="success"
            records={completedRecords}
            viewAllRoute={getAllRecordsViewRouteGov("completed")}
          />
        </div>
      )}
    </div>
  );
};
