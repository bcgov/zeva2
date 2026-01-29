import Excel from "exceljs";
import { getModelYearReportDetails } from "../data";
import { getArrayBuffer } from "@/app/lib/utils/parseReadable";
import { parseForecast } from "../utils";
import { ParsedForecastTables } from "./ParsedForecastReport";

export const ForecastReportDetails = async (props: { myrId: number }) => {
  const report = await getModelYearReportDetails(props.myrId);
  if (!report) {
    return null;
  }
  const forecastBuf = await getArrayBuffer(report.forecastFile);
  const forecastWorkbook = new Excel.Workbook();
  await forecastWorkbook.xlsx.load(forecastBuf);
  const parsedForecast = parseForecast(forecastWorkbook);

  return <ParsedForecastTables forecast={parsedForecast} />;
};
