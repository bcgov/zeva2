import Excel from "exceljs";
import { getModelYearReportDetails } from "../data";
import { parseForecast } from "../utils";
import { ParsedForecastTables } from "./ParsedForecastReport";

export const ForecastReportDetails = async (props: { myrId: number }) => {
  const report = await getModelYearReportDetails(props.myrId);
  if (!report) {
    return null;
  }
  const forecastWorkbook = new Excel.Workbook();
  await forecastWorkbook.xlsx.load(report.forecastFile);
  const parsedForecast = parseForecast(forecastWorkbook, report.modelYear);

  return <ParsedForecastTables forecast={parsedForecast} />;
};
