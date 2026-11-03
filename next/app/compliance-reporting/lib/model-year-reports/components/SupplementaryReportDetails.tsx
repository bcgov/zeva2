import Excel from "exceljs";
import { getSupplementaryReport } from "../data";
import { parseMyr } from "../utils";
import { ParsedModelYearReport } from "./ParsedModelYearReport";
import { getObjectAsBuffer } from "@/app/lib/services/s3";
import { VinListTable } from "./VinListTable";
import { getUserInfo } from "@/auth";

export const SupplementaryReportDetails = async (props: { suppId: number }) => {
  const { userIsGov } = await getUserInfo();
  const report = await getSupplementaryReport(props.suppId);
  if (!report) {
    return null;
  }
  const suppBuf = await getObjectAsBuffer(report.objectName);
  const suppWorkbook = new Excel.Workbook();
  await suppWorkbook.xlsx.load(suppBuf);
  const parsedSupp = parseMyr(suppWorkbook);
  return (
    <div className="flex flex-col gap-4">
      <ParsedModelYearReport
        type="supp"
        modelYear={report.modelYear}
        status={report.status}
        myr={parsedSupp}
      />
      <VinListTable
        type="supp"
        id={props.suppId}
        modelYear={report.modelYear}
        userIsGov={userIsGov}
      />
    </div>
  );
};
