"use client";

import { Dropzone } from "@/app/lib/components/Dropzone";
import { useState, useCallback } from "react";
import Excel from "exceljs";
import { ParsedApplication } from "./ParsedApplication";

export const AnalystUpload = () => {
  const [workbook, setWorkbook] = useState<Excel.Workbook | null>(null);
  const handleSubmit = useCallback(async (files: File[]) => {
    if (files.length === 1) {
      const file = files[0];
      const workbook = new Excel.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());
      setWorkbook(workbook);
    }
  }, []);

  return (
    <div>
      <Dropzone
        handleSubmit={handleSubmit}
        maxNumberOfFiles={1}
        allowedFileTypes={{
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
            ".xlsx",
          ],
        }}
      />
      {workbook && (
        <ParsedApplication
          workbook={workbook}
          actions={["Submit to Director", "Return to Supplier"]}
        />
      )}
    </div>
  );
};
