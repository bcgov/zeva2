import { getUserInfo } from "@/auth";
import { getLegacySupplementaries } from "../data";
import { LegacySupplementariesTable } from "./LegacySupplementariesTable";

export const LegacySupplementariesList = async () => {
  const { userIsGov } = await getUserInfo();
  const supplementaries = await getLegacySupplementaries();
  return (
    <LegacySupplementariesTable
      supplementaries={supplementaries}
      userIsGov={userIsGov}
    />
  );
};
