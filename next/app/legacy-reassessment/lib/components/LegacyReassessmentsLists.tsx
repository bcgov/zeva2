import { getUserInfo } from "@/auth";
import { getLegacyReassessments } from "../data";
import { LegacyReassessmentsTable } from "./LegacyReassessmentsTable";
import { getSerializedLegacyReassessments } from "../utilsServer";
import { ReactNode } from "react";

export const LegacyReassessmentsList = async (props: {
  headerContent?: ReactNode;
}) => {
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
      headerContent={props.headerContent}
    />
  );
};
