import Excel from "exceljs";
import { getModelYearReportDetails } from "../data";
import { parseMyr } from "../utils";
import { ParsedModelYearReport } from "./ParsedModelYearReport";

export const ModelYearReportDetails = async (props: { id: number }) => {
  const report = await getModelYearReportDetails(props.id);
  if (!report) {
    return null;
  }
  const myrWorkbook = new Excel.Workbook();
  await myrWorkbook.xlsx.load(report.myrFile);
  const parsedMyr = parseMyr(myrWorkbook);

  return <ParsedModelYearReport myr={parsedMyr} />;
};
