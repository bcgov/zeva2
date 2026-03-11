import { getUserInfo } from "@/auth";
import { getLegacyReassessments } from "../data";
import { LegacyReassessmentsTable } from "./LegacyReassessmentsTable";

export const LegacyReassessmentsList = async () => {
  const { userIsGov } = await getUserInfo();
  const reassessments = await getLegacyReassessments();
  return (
    <LegacyReassessmentsTable
      reassessments={reassessments}
      userIsGov={userIsGov}
    />
  );
};
