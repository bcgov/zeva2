import { getUserInfo } from "@/auth";
import { IcbcFilesTable } from "./IcbcFilesTable";
import { getIcbcFiles } from "../data";
import { getSerializedIcbcFiles } from "../utils";

export const IcbcFilesList = async (props: {
  page: number;
  pageSize: number;
  filters: Record<string, string>;
  sorts: Record<string, string>;
}) => {
  const { userIsGov } = await getUserInfo();
  if (!userIsGov) {
    return null;
  }
  const [files, totalNumberOfFiles] = await getIcbcFiles(
    props.page,
    props.pageSize,
    props.filters,
    props.sorts,
  );
  const serializedFiles = getSerializedIcbcFiles(files);

  return (
    <IcbcFilesTable
      files={serializedFiles}
      totalNumberOfFiles={totalNumberOfFiles}
    />
  );
};
