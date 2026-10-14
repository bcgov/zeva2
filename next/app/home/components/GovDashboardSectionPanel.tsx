import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faChevronRight,
  faCircle,
  faFile,
  faList,
  faMoneyBillTransfer,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  DashboardTone,
  dashboardToneClasses,
  GovDashboardCounts,
  SerializedAllRecordsRecord,
} from "../lib/constants";
import { getGovDashboardSectionCounts } from "../lib/services";

const breakdownRows: {
  label: keyof GovDashboardCounts;
  recordType: string;
  icon: IconDefinition;
}[] = [
  {
    label: "Model Year Reports",
    recordType: "Model Year Report",
    icon: faFile,
  },
  {
    label: "Credit Applications",
    recordType: "Credit Application",
    icon: faList,
  },
  {
    label: "Credit Transfers",
    recordType: "Credit Transfer",
    icon: faMoneyBillTransfer,
  },
];

export const GovDashboardSectionPanel = (props: {
  title: string;
  tone: DashboardTone;
  records: SerializedAllRecordsRecord[];
  viewAllRoute: string;
}) => {
  const tone = dashboardToneClasses[props.tone];
  const counts = getGovDashboardSectionCounts(props.records);
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  return (
    <div
      className={`flex flex-col overflow-hidden rounded border bg-lightGrey ${tone.border}`}
    >
      <div
        className={`flex flex-row items-center justify-between border-b px-4 py-4 ${tone.border} ${tone.bg}`}
      >
        <div className="flex flex-row items-center gap-4">
          <FontAwesomeIcon icon={faCircle} className={`h-6 w-6 ${tone.text}`} />
          <span className="text-lg font-bold">
            {props.title} ({total})
          </span>
        </div>
        <Link
          href={props.viewAllRoute}
          className="flex flex-row items-center gap-2 font-bold text-link underline"
        >
          View all
          <FontAwesomeIcon icon={faArrowRight} className="h-5 w-5" />
        </Link>
      </div>
      <div className="flex flex-col gap-4 p-4">
        {breakdownRows.map(({ label, recordType, icon }) => {
          const count = counts[label];
          if (count === 0) {
            return null;
          }
          // a lone record opens directly; several fall back to the section's list
          const matching = props.records.filter(
            (record) => record.type === recordType,
          );
          const href =
            matching.length === 1
              ? `${matching[0].baseRoute}/${matching[0].id}`
              : props.viewAllRoute;
          return (
            <Link
              key={label}
              href={href}
              className="flex flex-row items-center justify-between rounded border border-dividerMedium bg-white px-5 py-5 hover:bg-disabledSurface"
            >
              <div className="flex flex-row items-center gap-4">
                <FontAwesomeIcon
                  icon={icon}
                  className="h-5 w-6 text-primaryIcon"
                />
                <span>
                  <span className="font-bold text-secondaryText">{label}</span>
                  {" - "}
                  <span className="text-secondaryText">{count}</span>
                </span>
              </div>
              <FontAwesomeIcon
                icon={faChevronRight}
                className="h-4 w-4 text-link"
              />
            </Link>
          );
        })}
        {total === 0 && (
          <span className="text-sm text-secondaryText">No records</span>
        )}
      </div>
    </div>
  );
};
