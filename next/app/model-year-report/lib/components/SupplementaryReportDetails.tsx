import Excel from "exceljs";
import { getSupplementaryReport } from "../data";
import { getArrayBuffer } from "@/app/lib/utils/parseReadable";
import { parseMyr } from "../utils";
import { ParsedModelYearReport } from "./ParsedModelYearReport";
import { getObject } from "@/app/lib/minio";
import { getSupplementaryReportStatusEnumsToStringsMap } from "@/app/lib/utils/enumMaps";

export const SupplementaryReportDetails = async (props: { suppId: number }) => {
  const report = await getSupplementaryReport(props.suppId);
  if (!report) {
    return null;
  }
  const file = await getObject(report.objectName);
  const suppBuf = await getArrayBuffer(file);
  const suppWorkbook = new Excel.Workbook();
  await suppWorkbook.xlsx.load(suppBuf);
  const parsedSupp = parseMyr(suppWorkbook);
  const statusMap = getSupplementaryReportStatusEnumsToStringsMap();

  return (
    <ul className="space-y-3">
      <li>Status: {statusMap[report.status]}</li>
      <li>Sequence Number: {report.sequenceNumber}</li>
      <ParsedModelYearReport myr={parsedSupp} />
    </ul>
  );
};
