import Excel from "exceljs";
import { getArrayBuffer } from "@/app/lib/utils/parseReadable";
import { parseAssessment } from "../utils";
import { ParsedAssessment } from "./ParsedAssessment";
import { getAssessment, getReassessment } from "../data";
import { getObject } from "@/app/lib/minio";

// used by both assessments and reassessments; id is either a myrId or a reassessmentId
export const AssessmentDetails = async (props: {
  type: "assessment" | "reassessment";
  id: number;
}) => {
  let objectName;
  switch (props.type) {
    case "assessment":
      const assessment = await getAssessment(props.id);
      if (assessment) {
        objectName = assessment.objectName;
      }
      break;
    case "reassessment":
      const reassessment = await getReassessment(props.id);
      if (reassessment) {
        objectName = reassessment.objectName;
      }
      break;
  }
  if (!objectName) {
    return null;
  }
  const file = await getObject(objectName);
  const assmntBuf = await getArrayBuffer(file);
  const assmntWorkbook = new Excel.Workbook();
  await assmntWorkbook.xlsx.load(assmntBuf);
  const parsedAssessment = parseAssessment(assmntWorkbook);
  return <ParsedAssessment assessment={parsedAssessment} />;
};
