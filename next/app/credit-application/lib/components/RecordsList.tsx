import { getValidatedRecords } from "../data";
import { getSerializedRecords } from "../utils";
import { RecordsTable } from "./RecordsTable";

export const RecordsList = async (props: {
  id: number;
  page: number;
  pageSize: number;
  filters: Record<string, string>;
  sorts: Record<string, string>;
  readOnly: boolean;
}) => {
  const [records, totalNumberOfRecords] = await getValidatedRecords(
    props.id,
    props.page,
    props.pageSize,
    props.filters,
    props.sorts,
  );
  const serializedRecords = getSerializedRecords(records);

  return (
    <RecordsTable
      id={props.id}
      records={serializedRecords}
      totalNumbeOfRecords={totalNumberOfRecords}
      readOnly={props.readOnly}
    />
  );
};
