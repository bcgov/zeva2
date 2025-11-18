import Excel from "exceljs";
import { getUserInfo } from "@/auth";
import { getModelYearReportDetails } from "../data";
import { getMyrStatusEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { getArrayBuffer } from "@/app/lib/utils/parseReadable";
import { parseMyr } from "../utils";
import { ParsedModelYearReport } from "./ParsedModelYearReport";

export const ModelYearReportDetails = async (props: { id: number }) => {
  const report = await getModelYearReportDetails(props.id);
  if (!report) {
    return null;
  }
  const { userIsGov } = await getUserInfo();
  const statusMap = getMyrStatusEnumsToStringsMap();
  const myrBuf = await getArrayBuffer(report.myrFile);
  const myrWorkbook = new Excel.Workbook();
  await myrWorkbook.xlsx.load(myrBuf);
  const parsedMyr = parseMyr(myrWorkbook);

  return (
    <>
      <div>
        Status:{" "}
        {userIsGov
          ? statusMap[report.status]
          : statusMap[report.supplierStatus]}
      </div>
      <ParsedModelYearReport myr={parsedMyr} />
    </>
  );
};
