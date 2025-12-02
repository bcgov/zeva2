import Excel from "exceljs";
import { getModelYearReportDetails } from "../data";
import { getArrayBuffer } from "@/app/lib/utils/parseReadable";
import { parseMyr } from "../utils";
import { ParsedModelYearReport } from "./ParsedModelYearReport";

export const ModelYearReportDetails = async (props: { id: number }) => {
  const report = await getModelYearReportDetails(props.id);
  if (!report) {
    return null;
  }
  const myrBuf = await getArrayBuffer(report.myrFile);
  const myrWorkbook = new Excel.Workbook();
  await myrWorkbook.xlsx.load(myrBuf);
  const parsedMyr = parseMyr(myrWorkbook);

  return <ParsedModelYearReport myr={parsedMyr} />;
};
