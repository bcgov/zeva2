import { ReassessmentStatus } from "@/prisma/generated/enums";
import { LegacyReassessment, LegacyReassessmentSerialized } from "./constants";
import { getIsoYmdString } from "@/app/lib/utils/date";

export const getSerializedLegacyReassessments = (
  reassessments: LegacyReassessment[],
  userIsGov: boolean,
): LegacyReassessmentSerialized[] => {
  const result: LegacyReassessmentSerialized[] = [];
  for (const reassessment of reassessments) {
    let submittedDate = null;
    let issuedDate = null;
    for (const history of reassessment.ReassessmentHistory) {
      const userAction = history.userAction;
      const ts = getIsoYmdString(history.timestamp);
      if (
        userIsGov &&
        userAction === ReassessmentStatus.SUBMITTED_TO_DIRECTOR
      ) {
        submittedDate = ts;
      } else if (userAction === ReassessmentStatus.ISSUED) {
        issuedDate = ts;
      }
    }
    result.push({
      id: reassessment.id,
      modelYear: reassessment.modelYear,
      status: reassessment.status,
      supplier: reassessment.organization.name,
      submittedDate,
      issuedDate,
    });
  }
  return result;
};
