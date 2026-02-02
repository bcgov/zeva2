import { getUserInfo } from "@/auth";
import { getLegacyReassessments } from "../data";
import { LegacyReassessmentsTable } from "./LegacyReassessmentsTable";

export const LegacyReassessmentsList = async (props: {
  page: number;
  pageSize: number;
}) => {
  const { userIsGov } = await getUserInfo();
  const [reassessments, totalNumberOfReassessments] =
    await getLegacyReassessments(props.page, props.pageSize);
  return (
    <LegacyReassessmentsTable
      reassessments={reassessments}
      totalNumbeOfReassessments={totalNumberOfReassessments}
      userIsGov={userIsGov}
    />
  );
};
