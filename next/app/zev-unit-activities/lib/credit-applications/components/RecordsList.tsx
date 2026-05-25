import { getApplicationModelYears, getValidatedRecords } from "../data";
import { getSerializedRecords } from "../utilsServer";
import { RecordsTable } from "./RecordsTable";

export const RecordsList = async (props: {
  id: number;
  page: number;
  pageSize: number;
  filters: Record<string, string>;
  sorts: Record<string, string>;
  readOnly: boolean;
}) => {
  const [modelYears, [records, totalNumberOfRecords]] = await Promise.all([
    getApplicationModelYears(props.id),
    getValidatedRecords(
      props.id,
      props.page,
      props.pageSize,
      props.filters,
      props.sorts,
    ),
  ]);
  const serializedRecords = getSerializedRecords(records);

  return (
    <RecordsTable
      id={props.id}
      records={serializedRecords}
      totalNumbeOfRecords={totalNumberOfRecords}
      modelYears={modelYears}
      readOnly={props.readOnly}
    />
  );
};
