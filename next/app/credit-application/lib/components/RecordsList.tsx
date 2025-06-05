import { getValidatedRecords } from "../data";
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

  return (
    <RecordsTable
      id={props.id}
      records={records}
      totalNumbeOfRecords={totalNumberOfRecords}
      readOnly={props.readOnly}
    />
  );
};
