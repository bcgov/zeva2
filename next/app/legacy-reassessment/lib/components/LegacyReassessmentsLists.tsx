import { getUserInfo } from "@/auth";
import { getLegacyReassessments } from "../data";
import { LegacyReassessmentsTable } from "./LegacyReassessmentsTable";
import { getSerializedLegacyReassessments } from "../utilsServer";

export const LegacyReassessmentsList = async () => {
  const { userIsGov } = await getUserInfo();
  const reassessments = await getLegacyReassessments();
  const serializedReassessments = getSerializedLegacyReassessments(
    reassessments,
    userIsGov,
  );
  return (
    <LegacyReassessmentsTable
      reassessments={serializedReassessments}
      userIsGov={userIsGov}
    />
  );
};
