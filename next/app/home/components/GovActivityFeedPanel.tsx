import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faCar,
  faFile,
  faFileContract,
  faList,
  faListOl,
  faMoneyBillTransfer,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { Routes } from "@/app/lib/constants";
import {
  DashboardTone,
  dashboardToneClasses,
  SerializedActivityFeedRecord,
} from "../lib/constants";

const recordTypeStyles: Record<
  string,
  { icon: IconDefinition; tone: DashboardTone }
> = {
  "Credit Application": { icon: faList, tone: "success" },
  "ZEV Model": { icon: faCar, tone: "warning" },
  "Credit Transfer": { icon: faMoneyBillTransfer, tone: "success" },
  "Credit Agreement": { icon: faFileContract, tone: "success" },
  "Penalty Credits": { icon: faTriangleExclamation, tone: "error" },
  "Model Year Report": { icon: faFile, tone: "success" },
};

const formatDate = (ymd: string) => {
  const date = new Date(`${ymd}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return ymd;
  }
  return date.toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const GovActivityFeedPanel = (props: {
  records: SerializedActivityFeedRecord[];
}) => {
  return (
    <div className="flex flex-col overflow-hidden rounded border border-dividerMedium bg-lightGrey">
      <div className="flex flex-row items-center justify-between border-b border-dividerMedium bg-disabledSurface/70 px-4 py-4">
        <div className="flex flex-row items-center gap-4">
          <FontAwesomeIcon
            icon={faListOl}
            className="h-5 w-5 text-primaryIcon"
          />
          <span className="text-lg font-bold">Activity Feed</span>
        </div>
        <Link
          href={`${Routes.Home}/activity-feed`}
          className="flex flex-row items-center gap-2 font-bold text-link underline"
        >
          View all
          <FontAwesomeIcon icon={faArrowRight} className="h-5 w-5" />
        </Link>
      </div>
      <div className="flex flex-col px-4 py-2">
        {props.records.length === 0 && (
          <span className="py-3 text-sm text-secondaryText">
            No recent activity
          </span>
        )}
        <div className="flex flex-col divide-y divide-dividerMedium">
          {props.records.map((record) => {
            const style = recordTypeStyles[record.recordType] ?? {
              icon: faFile,
              tone: "success" as DashboardTone,
            };
            const toneText = dashboardToneClasses[style.tone].text;
            return (
              <Link
                key={`${record.recordType}-${record.id}-${record.dateTime}`}
                href={record.baseRoute}
                className="flex flex-row items-center justify-between gap-2 px-1 py-3.5 hover:bg-disabledSurface/50"
              >
                <div className="flex flex-row items-center gap-4">
                  <FontAwesomeIcon
                    icon={style.icon}
                    className={`h-5 w-6 ${toneText}`}
                  />
                  <span className="text-secondaryText">
                    <span className={`font-bold ${toneText}`}>
                      {record.recordType}
                    </span>
                    {" - "}
                    {record.activityType}
                  </span>
                </div>
                <span className="whitespace-nowrap font-bold text-secondaryText">
                  {formatDate(record.date)}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};
