import Excel from "exceljs";
import { getArrayBuffer } from "@/app/lib/utils/readableToBuffer";
import { parseAssessment } from "../utils";
import { ParsedAssessment } from "./ParsedAssessment";
import { getAssessmentObject } from "../data";

export const AssessmentDetails = async (props: { myrId: number }) => {
  const assessment = await getAssessmentObject(props.myrId);
  if (!assessment) {
    return null;
  }
  const assmntBuf = await getArrayBuffer(assessment);
  const assmntWorkbook = new Excel.Workbook();
  await assmntWorkbook.xlsx.load(assmntBuf);
  const parsedAssessment = parseAssessment(assmntWorkbook);

  return <ParsedAssessment assessment={parsedAssessment} />;
};
