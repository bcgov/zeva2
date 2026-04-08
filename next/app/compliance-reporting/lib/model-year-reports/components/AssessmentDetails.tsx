import Excel from "exceljs";
import { parseAssessment } from "../utils";
import { ParsedAssessment } from "./ParsedAssessment";
import { getAssessment, getReassessment, getSuppReassessment } from "../data";
import { getObjectAsBuffer } from "@/app/lib/services/s3";

// used for assessments, reassessments and supplementary reassessments;
// id is either a myrId, reassessmentId, or suppId
export const AssessmentDetails = async (props: {
  type: "assessment" | "reassessment" | "suppReassessment";
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
    case "suppReassessment":
      const suppReassessment = await getSuppReassessment(props.id);
      if (suppReassessment) {
        objectName = suppReassessment.objectName;
      }
      break;
  }
  if (!objectName) {
    return null;
  }
  const assmntBuf = await getObjectAsBuffer(objectName);
  const assmntWorkbook = new Excel.Workbook();
  await assmntWorkbook.xlsx.load(assmntBuf);
  const parsedAssessment = parseAssessment(assmntWorkbook);
  return <ParsedAssessment assessment={parsedAssessment} />;
};
