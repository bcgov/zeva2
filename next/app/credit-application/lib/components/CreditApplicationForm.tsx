"use client";

import axios from "axios";
import Excel from "exceljs";
import { Button } from "@/app/lib/components";
import { Dropzone } from "@/app/lib/components/Dropzone";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import { FileWithPath } from "react-dropzone";
import {
  getCreditApplicationAttachmentPutData,
  getSupplierEligibleVehicles,
  getSupplierTemplateDownloadUrl,
  supplierSave,
} from "../actions";
import { SupplierTemplate } from "../constants";
import { getModelYearEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { downloadBuffer } from "@/app/lib/utils/download";
import { Routes } from "@/app/lib/constants";
import { getDefaultAttchmentTypes } from "@/app/lib/utils/attachments";
import { Attachment } from "@/app/lib/services/attachments";

export const CreditApplicationForm = (props: {
  creditApplicationId?: number;
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [files, setFiles] = useState<FileWithPath[]>([]);
  const [attachments, setAttachments] = useState<FileWithPath[]>([]);
  const [error, setError] = useState<string>("");

  const allowedFileTypes = useMemo(() => {
    return getDefaultAttchmentTypes();
  }, []);

  const handleDownload = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        const [url, vehicles] = await Promise.all([
          getSupplierTemplateDownloadUrl(),
          getSupplierEligibleVehicles(),
        ]);
        const response = await axios.get(url, { responseType: "arraybuffer" });
        const template = response.data;
        const workbook = new Excel.Workbook();
        await workbook.xlsx.load(template);
        const vehiclesSheet = workbook.getWorksheet(
          SupplierTemplate.ValidVehiclesSheetName,
        );
        if (vehiclesSheet) {
          const modelYearsMap = getModelYearEnumsToStringsMap();
          vehicles.forEach((vehicle) => {
            vehiclesSheet.addRow([
              vehicle.make,
              vehicle.modelName,
              modelYearsMap[vehicle.modelYear],
            ]);
          });
        }
        const buffer = await workbook.xlsx.writeBuffer();
        const fileName = `credit-application-template-${new Date().toISOString()}.xlsx`;
        downloadBuffer(fileName, buffer);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, []);

  const handleSave = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        if (files.length !== 1) {
          throw new Error("Exactly 1 Credit Application file expected!");
        }
        const allAttachments = [files[0], ...attachments];
        const attachmentsPayload: Attachment[] = [];
        const putData = await getCreditApplicationAttachmentPutData(
          allAttachments.length,
        );
        for (const [index, attachment] of attachments.entries()) {
          const putDatum = putData[index];
          await axios.put(putDatum.url, attachment);
          attachmentsPayload.push({
            objectName: putDatum.objectName,
            fileName: attachment.name,
          });
        }
        const response = await supplierSave(
          attachmentsPayload,
          props.creditApplicationId,
        );
        if (response.responseType === "error") {
          throw new Error(response.message);
        }
        const applicationId = response.data;
        router.push(`${Routes.CreditApplication}/${applicationId}`);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, [props.creditApplicationId, files, attachments]);

  return (
    <div>
      {error && <p className="text-red-600">{error}</p>}
      <div className="flex space-x-2">
        <Button
          variant="secondary"
          onClick={handleDownload}
          disabled={isPending}
        >
          {isPending ? "..." : "Download Template"}
        </Button>
      </div>
      <div className="flex items-center space-x-4">
        <span>Upload your Application here:</span>
        <Dropzone
          files={files}
          setFiles={setFiles}
          disabled={isPending}
          maxNumberOfFiles={1}
          allowedFileTypes={{
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
              [".xlsx"],
          }}
        />
      </div>
      <div className="flex items-center space-x-4">
        <span>Additional Documents (optional):</span>
        <Dropzone
          files={attachments}
          setFiles={setAttachments}
          disabled={isPending}
          maxNumberOfFiles={10}
          allowedFileTypes={allowedFileTypes}
        />
      </div>
      <div className="flex space-x-2">
        <Button variant="primary" onClick={handleSave} disabled={isPending}>
          {isPending ? "..." : "Save"}
        </Button>
      </div>
    </div>
  );
};
