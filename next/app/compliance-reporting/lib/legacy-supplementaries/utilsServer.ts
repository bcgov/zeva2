import { getIsoYmdString } from "@/app/lib/utils/date";
import {
  LegacySupplementary,
  LegacySupplementarySerialized,
} from "./constants";
import { ModelYearReportStatus } from "@/prisma/generated/enums";
import { mapOfStatusToSupplierStatus } from "../model-year-reports/constants";

export const getSerializedLegacySupps = (
  supps: LegacySupplementary[],
  userIsGov: boolean,
): LegacySupplementarySerialized[] => {
  const result: LegacySupplementarySerialized[] = [];
  for (const supp of supps) {
    let submittedDate = null;
    let assessedDate = null;
    for (const history of supp.SupplementaryReportHistory) {
      const userAction = history.userAction;
      const ts = getIsoYmdString(history.timestamp);
      if (userAction === ModelYearReportStatus.SUBMITTED_TO_GOVERNMENT) {
        submittedDate = ts;
      } else if (userAction === ModelYearReportStatus.ASSESSED) {
        assessedDate = ts;
      }
    }
    result.push({
      id: supp.id,
      modelYear: supp.modelYear,
      status: userIsGov
        ? supp.status
        : mapOfStatusToSupplierStatus[supp.status],
      supplier: supp.organization.name,
      submittedDate,
      assessedDate,
    });
  }
  return result;
};
