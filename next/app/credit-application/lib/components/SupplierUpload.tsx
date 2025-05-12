"use client";
import axios from "axios";
import { useCallback } from "react";
import Excel from "exceljs";
import { Dropzone } from "@/app/lib/components/Dropzone";

export const SupplierUpload = (props: {
  getPutData: () => Promise<{ objectName: string; url: string } | undefined>;
  processFile: (objectName: string, fileName: string) => Promise<void>;
}) => {
  const handleSubmit = useCallback(
    async (files: File[]) => {
      if (files.length === 1) {
        const file = files[0];
        const workbook = new Excel.Workbook();
        await workbook.xlsx.load(await file.arrayBuffer());
        const dataSheet = workbook.getWorksheet("ZEVs Supplied");
        if (dataSheet) {
          const rowCount = dataSheet.rowCount;
          if (rowCount >= 2 && rowCount <= 2001) {
            // todo: in frontend, check for duplicate vins; send vins to backend to check for
            // vins that were awarded credits; send vehicle info to backend to check for
            // vins not associated with a supplier's vehicles, etc.
            const putData = await props.getPutData();
            if (putData) {
              const objectName = putData.objectName;
              const url = putData.url;
              await axios.put(url, file);
              await props.processFile(objectName, file.name);
            }
          }
        }
      }
    },
    [props.getPutData, props.processFile],
  );

  return (
    <Dropzone
      handleSubmit={handleSubmit}
      maxNumberOfFiles={1}
      allowedFileTypes={{
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
          ".xlsx",
        ],
      }}
    />
  );
};
