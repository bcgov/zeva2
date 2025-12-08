"use client";

import axios from "axios";
import Excel from "exceljs";
import { Button } from "@/app/lib/components";
import { Dropzone } from "@/app/lib/components/Dropzone";
import { CommentBox } from "@/app/lib/components/inputs/CommentBox";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import { FileWithPath } from "react-dropzone";
import {
  getCreditApplicationPutData,
  getSupplierEligibleVehicles,
  getSupplierTemplateDownloadUrl,
  processSupplierFile,
} from "../actions";
import { SupplierTemplate } from "../constants";
import { getModelYearEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { downloadBuffer } from "@/app/lib/utils/download";
import { Routes } from "@/app/lib/constants";
import { getNormalizedComment } from "../utils";
import { Attachment } from "@/app/lib/services/attachments";
import { getDefaultAttchmentTypes } from "@/app/lib/utils/attachments";

export const CreditApplicationForm = (props: { userOrgName: string }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [files, setFiles] = useState<FileWithPath[]>([]);
  const [attachments, setAttachments] = useState<FileWithPath[]>([]);
  const [error, setError] = useState<string>("");
  const [comment, setComment] = useState<string>("");

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
        const fileName = `credit-application-template-${props.userOrgName}-${new Date().toISOString()}.xlsx`;
        downloadBuffer(fileName, buffer);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, [props.userOrgName]);

  const handleSubmit = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        if (files.length !== 1) {
          throw new Error("Exactly 1 Credit Application file expected!");
        }
        const file = files[0];
        const documents = [file, ...attachments];
        const putData = await getCreditApplicationPutData(
          1 + attachments.length,
        );
        const attachmentsPayload: Attachment[] = [];
        for (const [index, document] of documents.entries()) {
          const { objectName, url } = putData[index];
          await axios.put(url, document);
          attachmentsPayload.push({ fileName: document.name, objectName });
        }
        const response = await processSupplierFile(
          attachmentsPayload,
          getNormalizedComment(comment),
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
  }, [files, attachments, comment]);

  return (
    <div>
      {error && <p className="text-red-600">{error}</p>}
      <div className="flex space-x-2">
        <Button variant="secondary" onClick={handleDownload} disabled={isPending}>
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
      <CommentBox
        comment={comment}
        setComment={setComment}
        disabled={isPending}
      />
      <div className="flex space-x-2">
        <Button variant="primary" onClick={handleSubmit} disabled={isPending}>
          {isPending ? "..." : "Submit"}
        </Button>
      </div>
    </div>
  );
};
