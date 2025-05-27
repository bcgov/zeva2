"use client";

import { Dropzone } from "@/app/lib/components/Dropzone";
import { useState, useCallback } from "react";
import Excel from "exceljs";
import { ParsedApplication } from "./ParsedApplication";
import { AnalystActions } from "./AnalystActions";

export const AnalystUpload = (props: { creditApplicationId: number }) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [workbook, setWorkbook] = useState<Excel.Workbook | null>(null);
  const handleDrop = useCallback(async (files: File[]) => {
    if (files.length === 1) {
      const file = files[0];
      const workbook = new Excel.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());
      setFile(file);
      setFileName(file.name);
      setWorkbook(workbook);
    }
  }, []);

  return (
    <div>
      <Dropzone
        handleDrop={handleDrop}
        maxNumberOfFiles={1}
        allowedFileTypes={{
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
            ".xlsx",
          ],
        }}
      />
      {workbook && file && fileName && (
        <>
          <ParsedApplication workbook={workbook} />
          <AnalystActions
            creditApplicationId={props.creditApplicationId}
            file={file}
            fileName={fileName}
          />
        </>
      )}
    </div>
  );
};
