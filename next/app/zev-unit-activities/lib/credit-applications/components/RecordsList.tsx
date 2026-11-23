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
  const [modelYears, records] = await Promise.all([
    getApplicationModelYears(props.id),
    getValidatedRecords(props.id),
  ]);
  const serializedRecords = getSerializedRecords(records);

  return (
    <RecordsTable
      id={props.id}
      records={serializedRecords}
      modelYears={modelYears}
      readOnly={props.readOnly}
    />
  );
};
