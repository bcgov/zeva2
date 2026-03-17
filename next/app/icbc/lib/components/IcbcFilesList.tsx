import { getUserInfo } from "@/auth";
import { IcbcFilesTable } from "./IcbcFilesTable";
import { getIcbcFiles } from "../data";
import { getSerializedIcbcFiles } from "../utils";
import { ReactNode } from "react";

export const IcbcFilesList = async (props: { headerContent?: ReactNode }) => {
  const { userIsGov } = await getUserInfo();
  if (!userIsGov) {
    return null;
  }
  const files = await getIcbcFiles();
  const serializedFiles = getSerializedIcbcFiles(files);

  return (
    <IcbcFilesTable files={serializedFiles} headerContent={props.headerContent} />
  );
};
