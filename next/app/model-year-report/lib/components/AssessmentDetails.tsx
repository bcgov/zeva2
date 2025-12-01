import Excel from "exceljs";
import { getArrayBuffer } from "@/app/lib/utils/parseReadable";
import { parseAssessment } from "../utils";
import { ParsedAssessment } from "./ParsedAssessment";
import { getAssessmentObject, getReassessmentObject } from "../data";
import { Readable } from "stream";

// used by both assessments and reassessments; id is either a myrId or a reassessmentId
export const AssessmentDetails = async (props: {
  type: "assessment" | "reassessment";
  id: number;
}) => {
  let object: Readable | null = null;
  if (props.type === "assessment") {
    object = await getAssessmentObject(props.id);
  } else if (props.type === "reassessment") {
    object = await getReassessmentObject(props.id);
  }
  if (!object) {
    return null;
  }
  const assmntBuf = await getArrayBuffer(object);
  const assmntWorkbook = new Excel.Workbook();
  await assmntWorkbook.xlsx.load(assmntBuf);
  const parsedAssessment = parseAssessment(assmntWorkbook);

  return <ParsedAssessment assessment={parsedAssessment} />;
};
