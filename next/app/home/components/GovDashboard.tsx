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
import {
  getGovCompletedRecords,
  getGovInProgressRecords,
  getGovRequiresActionRecords,
  getGovWithDirectorRecords,
  getRecentActivityFeedRecords,
} from "../lib/services";
import {
  AllRecordsView,
  allRecordsViewParam,
  DashboardTone,
  dashboardToneClasses,
} from "../lib/constants";
import { GovDashboardSectionPanel } from "./GovDashboardSectionPanel";
import { GovActivityFeedPanel } from "./GovActivityFeedPanel";

const activityFeedPreviewCount = 5;

const getViewAllRoute = (view: AllRecordsView) =>
  `${Routes.Home}/all-records?${allRecordsViewParam}=${view}`;

export const GovDashboard = async () => {
  const { userName, userRoles } = await getUserInfo();
  const [
    requiresActionRecords,
    inProgressRecords,
    withDirectorRecords,
    completedRecords,
    activityFeedRecords,
  ] = await Promise.all([
    getGovRequiresActionRecords(userRoles),
    getGovInProgressRecords(userRoles),
    getGovWithDirectorRecords(),
    getGovCompletedRecords(),
    getRecentActivityFeedRecords(activityFeedPreviewCount),
  ]);

  const summaryCards = [
    {
      label: "Action Required",
      count: requiresActionRecords.length,
      icon: faCircleExclamation,
      tone: "error" as DashboardTone,
      viewAllRoute: getViewAllRoute(AllRecordsView.RequiresYourAction),
    },
    {
      label: "In Progress",
      count: inProgressRecords.length,
      icon: faHourglassHalf,
      tone: "warning" as DashboardTone,
      viewAllRoute: getViewAllRoute(AllRecordsView.InProgress),
    },
    {
      label: "With Director",
      count: withDirectorRecords.length,
      icon: faUser,
      tone: "info" as DashboardTone,
      viewAllRoute: getViewAllRoute(AllRecordsView.WithDirector),
    },
    {
      label: "Completed",
      count: completedRecords.length,
      icon: faCircleCheck,
      tone: "success" as DashboardTone,
      viewAllRoute: getViewAllRoute(AllRecordsView.Completed),
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
              href={`${Routes.Home}/all-records`}
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
        <GovDashboardSectionPanel
          title="Requires Your Action"
          tone="error"
          records={requiresActionRecords}
          viewAllRoute={getViewAllRoute(AllRecordsView.RequiresYourAction)}
        />
        <GovActivityFeedPanel records={activityFeedRecords} />
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <GovDashboardSectionPanel
          title="In Progress"
          tone="warning"
          records={inProgressRecords}
          viewAllRoute={getViewAllRoute(AllRecordsView.InProgress)}
        />
        <GovDashboardSectionPanel
          title="With Director"
          tone="info"
          records={withDirectorRecords}
          viewAllRoute={getViewAllRoute(AllRecordsView.WithDirector)}
        />
        <GovDashboardSectionPanel
          title="Completed"
          tone="success"
          records={completedRecords}
          viewAllRoute={getViewAllRoute(AllRecordsView.Completed)}
        />
      </div>
    </div>
  );
};
