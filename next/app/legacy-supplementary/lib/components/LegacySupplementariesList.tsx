import { getUserInfo } from "@/auth";
import { getLegacySupplementaries } from "../data";
import { LegacySupplementariesTable } from "./LegacySupplementariesTable";
import { getSerializedLegacySupps } from "../utilsServer";

export const LegacySupplementariesList = async () => {
  const { userIsGov } = await getUserInfo();
  const supplementaries = await getLegacySupplementaries();
  const serializedSupplementaries = getSerializedLegacySupps(
    supplementaries,
    userIsGov,
  );
  return (
    <LegacySupplementariesTable
      supplementaries={serializedSupplementaries}
      userIsGov={userIsGov}
    />
  );
};
