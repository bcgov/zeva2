import Excel from "exceljs";
import { getSupplementaryReport } from "../data";
import { parseMyr } from "../utils";
import { ParsedModelYearReport } from "./ParsedModelYearReport";
import { getObjectAsBuffer } from "@/app/lib/services/s3";

export const SupplementaryReportDetails = async (props: { suppId: number }) => {
  const report = await getSupplementaryReport(props.suppId);
  if (!report) {
    return null;
  }
  const suppBuf = await getObjectAsBuffer(report.objectName);
  const suppWorkbook = new Excel.Workbook();
  await suppWorkbook.xlsx.load(suppBuf);
  const parsedSupp = parseMyr(suppWorkbook);
  return <ParsedModelYearReport myr={parsedSupp} />;
};
