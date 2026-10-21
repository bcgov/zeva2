import { Routes } from "@/app/lib/constants";
import {
  allRecordsTypesGov,
  allRecordsTypesSupplier,
  allRecordsViewParam,
  AllRecordTypeGov,
  AllRecordTypeSupplier,
  GovDashboardCounts,
  recordTypes,
  SerializedAllRecordsRecordGov,
} from "./constants";

export const isAllRecordTypeGov = (s: string): s is AllRecordTypeGov => {
  for (const type of allRecordsTypesGov) {
    if (type === s) {
      return true;
    }
  }
  return false;
};

export const isAllRecordTypeSupplier = (
  s: string,
): s is AllRecordTypeSupplier =>
  allRecordsTypesSupplier.some((type) => type === s);

export const getAllRecordsViewRouteGov = (view: AllRecordTypeGov) =>
  `${Routes.Home}/all-records-gov?${allRecordsViewParam}=${view}`;

export const getAllRecordsViewRouteSupplier = (view: AllRecordTypeSupplier) =>
  `${Routes.Home}/all-records-supplier?${allRecordsViewParam}=${view}`;

export const getGovDashboardSectionCounts = (
  records: SerializedAllRecordsRecordGov[],
): GovDashboardCounts => {
  const counts: GovDashboardCounts = {
    "Credit Application": 0,
    "Model Year Report": 0,
    "Credit Transfer": 0,
    "ZEV Model": 0,
    "Credit Agreement": 0,
    "Penalty Credits": 0,
  };
  for (const record of records) {
    for (const recordType of recordTypes) {
      if (record.type === recordType) {
        counts[recordType] = counts[recordType] + 1;
        break;
      }
    }
  }
  return counts;
};
