import { getIsoYmdString, validateDate } from "@/app/lib/utils/date";
import {
  AllRecordsRecord,
  RecordType,
  SerializedAllRecordsRecord,
} from "./constants";
import { getRoleEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import Decimal from "decimal.js";

export const getThirtyDaysAgo = () => {
  return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
};

export const getSerializedAllRecordsRecord = (
  type: RecordType,
  record: AllRecordsRecord,
  baseRoute: string,
): SerializedAllRecordsRecord => {
  const now = new Date();
  const ts = record.mostRecentHistoryEntry.timestamp;
  const user = record.mostRecentHistoryEntry.user;
  const rolesMap = getRoleEnumsToStringsMap();
  const id = record.id;
  return {
    id,
    type,
    supplier: record.organization.name,
    status: record.status,
    lastUpdated: `${new Decimal(now.getTime() - ts.getTime()).div(1000 * 60 * 60 * 24).toFixed(0)} days ago`,
    lastUpdatedBy: `${user.firstName} ${user.lastName} - ${user.roles.map((role) => rolesMap[role]).join(", ")}`,
    date: getIsoYmdString(ts),
    baseRoute,
  };
};

export const getDateRangeOptions = (
  records: SerializedAllRecordsRecord[],
  intervals: number,
): [string, string][] => {
  const dates = new Set<string>();
  for (const record of records) {
    dates.add(record.date);
  }
  const sortedDates = [...dates].sort();
  if (sortedDates.length < 2) {
    return [];
  }
  const leastDateString = sortedDates[0];
  const greatestDateString = sortedDates[1];
  const intervalsDec = new Decimal(intervals);
  if (!intervalsDec.isInteger() || intervalsDec.lte(0)) {
    return [];
  }
  const [leastDateValid, leastDate] = validateDate(leastDateString);
  const [greatestDateValid, greatestDate] = validateDate(greatestDateString);
  if (!leastDateValid || !greatestDateValid) {
    return [];
  }
  const result: [string, string][] = [];
  const diff = greatestDate.getTime() - leastDate.getTime();
  const intervalLength = new Decimal(diff)
    .dividedToIntegerBy(intervals)
    .toNumber();
  let intervalStart = leastDate.getTime();
  for (let i = 1; i <= intervals; i++) {
    const intervalEnd = intervalStart + intervalLength;
    result.push([
      getIsoYmdString(new Date(intervalStart)),
      getIsoYmdString(new Date(intervalEnd)),
    ]);
    intervalStart = intervalEnd;
  }
  return result;
};
