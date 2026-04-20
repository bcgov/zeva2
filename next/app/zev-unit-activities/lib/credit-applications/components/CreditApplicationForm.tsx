"use client";

import axios, { AxiosResponse } from "axios";
import Excel from "exceljs";
import { Button } from "@/app/lib/components";
import { Dropzone } from "@/app/lib/components/Dropzone";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  getCreditApplicationAttachmentPutData,
  getCreditApplicationPutData,
  getSupplierEligibleVehicles,
  getSupplierTemplateDownloadUrl,
  supplierSave,
} from "../actions";
import { SupplierTemplate } from "../constants";
import { getModelYearEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { downloadBuffer, getFiles } from "@/app/lib/utils/download";
import { Routes } from "@/app/lib/constants";
import { Attachment, AttachmentDownload } from "@/app/lib/constants/attachment";
import { TextInput } from "@/app/lib/components";

export const CreditApplicationForm = (props: {
  legalName: string;
  recordsAddress: string;
  serviceAddress: string;
  makes: string;
  creditApplication?: {
    id: number;
    applicationFile: AttachmentDownload;
    attachments: AttachmentDownload[];
  };
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [legalName, setLegalName] = useState<string>();
  const [serviceAddress, setServiceAddress] = useState<string>();
  const [recordsAddress, setRecordsAddress] = useState<string>();
  const [makes, setMakes] = useState<string>();
  const [files, setFiles] = useState<File[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const loadPrev = async () => {
      const creditApplication = props.creditApplication;
      if (creditApplication) {
        const attachments = [
          creditApplication.applicationFile,
          ...creditApplication.attachments,
        ];
        const downloadedFiles = await getFiles(attachments);
        const toSet = downloadedFiles.map((file) => {
          return new File([file.data], file.fileName);
        });
        setFiles([toSet[0]]);
        if (toSet.length > 1) {
          setAttachments(toSet.slice(1));
        }
      }
    };
    loadPrev();
  }, []);

  useEffect(() => {
    setLegalName(props.legalName);
    setRecordsAddress(props.recordsAddress);
    setServiceAddress(props.serviceAddress);
    setMakes(props.makes);
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
        if (!legalName || !recordsAddress || !serviceAddress || !makes) {
          throw new Error("No field may be empty!");
        }
        if (files.length !== 1) {
          throw new Error("Exactly 1 Credit Application file expected!");
        }
        const application = files[0];
        const puts: Promise<AxiosResponse>[] = [];
        const applicationPutData = await getCreditApplicationPutData();
        puts.push(
          axios.put(applicationPutData.url, application, {
            headers: { "if-none-match": "*" },
          }),
        );
        const attachmentsPayload: Attachment[] = [];
        const attachmentsPutData = await getCreditApplicationAttachmentPutData(
          attachments.length,
        );
        for (const [index, attachment] of attachments.entries()) {
          const putDatum = attachmentsPutData[index];
          puts.push(
            axios.put(putDatum.url, attachment, {
              headers: { "if-none-match": "*" },
            }),
          );
          attachmentsPayload.push({
            objectName: putDatum.objectName,
            fileName: attachment.name,
          });
        }
        await Promise.all(puts);
        const response = await supplierSave(
          legalName,
          recordsAddress,
          serviceAddress,
          makes,
          applicationPutData.objectName,
          application.name,
          attachmentsPayload,
          props.creditApplication?.id,
        );
        if (response.responseType === "error") {
          throw new Error(response.message);
        }
        const applicationId = response.data;
        router.push(`${Routes.CreditApplications}/${applicationId}`);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, [
    props.creditApplication,
    legalName,
    recordsAddress,
    serviceAddress,
    makes,
    files,
    attachments,
  ]);

  return (
    <div>
      {error && <p className="text-red-600">{error}</p>}
      <div className="py-2 my-2">
        <TextInput
          label="Legal Name"
          value={legalName ?? ""}
          onChange={setLegalName}
          disabled={isPending}
        />
      </div>
      <div className="py-2 my-2">
        <TextInput
          label="Records Address"
          value={recordsAddress ?? ""}
          onChange={setRecordsAddress}
          disabled={isPending}
        />
      </div>
      <div className="py-2 my-2">
        <TextInput
          label="Service Address"
          value={serviceAddress ?? ""}
          onChange={setServiceAddress}
          disabled={isPending}
        />
      </div>
      <div className="py-2 my-2">
        <TextInput
          label="Makes"
          value={makes ?? ""}
          onChange={setMakes}
          disabled={isPending}
        />
      </div>
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
