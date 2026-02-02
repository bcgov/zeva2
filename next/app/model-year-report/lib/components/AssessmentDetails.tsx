import Excel from "exceljs";
import { getArrayBuffer } from "@/app/lib/utils/parseReadable";
import { parseAssessment } from "../utils";
import { ParsedAssessment } from "./ParsedAssessment";
import { getAssessment, getReassessment } from "../data";
import { getObject } from "@/app/lib/minio";
import { getReassessmentStatusEnumsToStringsMap } from "@/app/lib/utils/enumMaps";

// used by both assessments and reassessments; id is either a myrId or a reassessmentId
export const AssessmentDetails = async (props: {
  type: "assessment" | "reassessment";
  id: number;
}) => {
  const getAssessmentComponent = async (objectName: string) => {
    const file = await getObject(objectName);
    const assmntBuf = await getArrayBuffer(file);
    const assmntWorkbook = new Excel.Workbook();
    await assmntWorkbook.xlsx.load(assmntBuf);
    const parsedAssessment = parseAssessment(assmntWorkbook);
    return <ParsedAssessment assessment={parsedAssessment} />;
  };

  switch (props.type) {
    case "assessment":
      const assessment = await getAssessment(props.id);
      if (!assessment) {
        return null;
      }
      return getAssessmentComponent(assessment.objectName);
    case "reassessment":
      const reassessment = await getReassessment(props.id);
      if (!reassessment) {
        return null;
      }
      const statusMap = getReassessmentStatusEnumsToStringsMap();
      return (
        <ul className="space-y-3">
          <li>Status: {statusMap[reassessment.status]}</li>
          <li>Sequence Number: {reassessment.sequenceNumber}</li>
          {getAssessmentComponent(reassessment.objectName)}
        </ul>
      );
  }
};
