import { getUserInfo } from "@/auth";
import { getLegacySupplementaries } from "../data";
import { LegacySupplementariesTable } from "./LegacySupplementariesTable";

export const LegacySupplementariesList = async (props: {
  page: number;
  pageSize: number;
}) => {
  const { userIsGov } = await getUserInfo();
  const [supplementaries, totalNumberOfSupplementaries] =
    await getLegacySupplementaries(props.page, props.pageSize);
  return (
    <LegacySupplementariesTable
      supplementaries={supplementaries}
      totalNumbeOfSupplementaries={totalNumberOfSupplementaries}
      userIsGov={userIsGov}
    />
  );
};
