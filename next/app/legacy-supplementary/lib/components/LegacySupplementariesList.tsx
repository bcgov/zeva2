import { getUserInfo } from "@/auth";
import { getLegacySupplementaries } from "../data";
import { LegacySupplementariesTable } from "./LegacySupplementariesTable";
import { getSerializedLegacySupps } from "../utilsServer";
import { ReactNode } from "react";

export const LegacySupplementariesList = async (props: {
  headerContent?: ReactNode;
}) => {
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
      headerContent={props.headerContent}
    />
  );
};
