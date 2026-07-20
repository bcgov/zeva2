"use client";

import axios, { AxiosResponse } from "axios";
import Excel from "exceljs";
import { Dropzone } from "@/app/lib/components/Dropzone";
import { Button, StatusBanner } from "@/app/lib/components";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { FileWithPath } from "react-dropzone";
import { CreditApplicationSupplierStatus } from "@/prisma/generated/enums";
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
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import { PrintDownloadButton } from "@/app/lib/components/PrintDownloadButton";
import { ValidationError } from "@/app/lib/utils/actionResponse";

export const CreditApplicationForm = (props: {
  legalName: string;
  recordsAddress: string;
  serviceAddress: string;
  makes: string;
  supplierStatus?: CreditApplicationSupplierStatus;
  creditApplication?: {
    id: number;
    applicationFile: AttachmentDownload;
    attachments: AttachmentDownload[];
  };
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [files, setFiles] = useState<FileWithPath[]>([]);
  const [attachments, setAttachments] = useState<FileWithPath[]>([]);
  const [error, setError] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    [],
  );

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
  }, [props.creditApplication]);

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

  const handlePrintDownload = useCallback(() => {
    globalThis.print();
  }, []);

  const handleSave = useCallback(() => {
    setError("");
    setValidationErrors([]);
    startTransition(async () => {
      try {
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
          props.legalName,
          props.recordsAddress,
          props.serviceAddress,
          props.makes,
          applicationPutData.objectName,
          application.name,
          attachmentsPayload,
          props.creditApplication?.id,
        );
        if (response.responseType === "validationErrors") {
          setValidationErrors(response.errors);
          return;
        }
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
    props.legalName,
    props.recordsAddress,
    props.serviceAddress,
    props.makes,
    files,
    attachments,
  ]);

  const handleBack = useCallback(() => {
    if (props.creditApplication) {
      router.push(`${Routes.CreditApplications}/${props.creditApplication.id}`);
    } else {
      router.push(Routes.CreditApplications);
    }
  }, [props.creditApplication]);

  const fileSize = files[0] ? (files[0].size / 1024).toFixed(1) : "0";

  const getStatusBanner = () => {
    if (
      !props.supplierStatus ||
      props.supplierStatus === CreditApplicationSupplierStatus.DRAFT
    ) {
      return <StatusBanner title="STATUS - Draft" primaryText="" />;
    }

    switch (props.supplierStatus) {
      case CreditApplicationSupplierStatus.SUBMITTED:
        return (
          <StatusBanner
            title="STATUS - Submitted"
            primaryText="Your credit application has been submitted and is under review."
          />
        );
      case CreditApplicationSupplierStatus.REJECTED:
        return (
          <StatusBanner
            title="STATUS - Rejected"
            primaryText="Your credit application has been rejected. Please review the comments and resubmit."
          />
        );
      case CreditApplicationSupplierStatus.APPROVED:
        return (
          <StatusBanner
            title="STATUS - Approved"
            primaryText="Your credit application has been approved."
          />
        );
      default:
        return <StatusBanner title="STATUS - Draft" primaryText="" />;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between p-5 rounded-t bg-[#E7E7E7]">
        <div className="text-black text-[26px] leading-7 font-bold">
          {props.creditApplication?.id
            ? `Credit Application ID ${props.creditApplication.id}`
            : "New Credit Application"}
        </div>
        <div className="flex h-10 items-center justify-center gap-2 px-4 py-[5px]">
          <PrintDownloadButton icon={<FontAwesomeIcon icon={faDownload} />}>
            Print/Download Page
          </PrintDownloadButton>
        </div>
      </div>

      {getStatusBanner()}
      <hr className="border-dividerMedium"></hr>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-6 self-start">
          <div className="flex flex-col border border-dividerMedium rounded">
            <div className="px-5 py-4 text-xl font-bold bg-disabledBG">
              Supplier Information
            </div>
            <div className="p-5 grid grid-cols-2 items-center gap-y-3">
              <div className="font-bold">Legal Name:</div>
              <div>{props.legalName}</div>
              <hr className="col-span-2 border-disabledBG"></hr>
              <div className="font-bold">Records Address:</div>
              <div>{props.recordsAddress}</div>
              <hr className="col-span-2 border-disabledBG"></hr>
              <div className="font-bold">Service Address:</div>
              <div>{props.serviceAddress}</div>
              <hr className="col-span-2 border-disabledBG"></hr>
              <div className="font-bold">Makes:</div>
              <div>{props.makes}</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col rounded border border-dividerMedium">
          <div className="px-5 py-4 text-xl font-bold bg-disabledSurface">
            Credit Application Details
          </div>

          <div className="flex flex-col gap-2 px-5 py-4 rounded-t bg-[#F4F4F4]">
            <span className="text-sm font-bold">
              Step 1: Download the Credit Application Template
            </span>
            <span className="text-sm">
              Use this template to complete your credit application before
              uploading.
            </span>
          </div>

          <div className="flex flex-row justify-start p-5">
            <Button
              variant="secondary"
              onClick={handleDownload}
              disabled={isPending}
              icon={<FontAwesomeIcon icon={faDownload} />}
            >
              Download Template
            </Button>
          </div>

          <div className="flex flex-col gap-2 px-5 py-4 rounded-t bg-[#F4F4F4]">
            <span className="text-sm font-bold">
              Step 2: Upload Credit Application
            </span>
            <span className="text-sm">
              Upload the completed file using template above.
            </span>
          </div>

          <div className="flex flex-col gap-3 p-5">
            {files.length > 0 && (
              <StatusBanner
                title="File uploaded successfully."
                primaryText="Review the data below before saving. To upload a new file, delete the current one."
              />
            )}
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
        </div>

        <div className="flex flex-col rounded border border-dividerMedium">
          <div className="bg-disabledSurface px-5 py-4 text-xl font-bold">
            Supporting Documents (optional)
          </div>
          <div className="p-5">
            <Dropzone
              files={attachments}
              setFiles={setAttachments}
              disabled={isPending}
              maxNumberOfFiles={10}
            />
          </div>
        </div>

        <div className="flex flex-row items-center justify-between p-5 bg-lightGrey">
          <Button variant="secondary" onClick={handleBack} disabled={isPending}>
            ← Back
          </Button>
          <div className="flex flex-row gap-3 items-center">
            {error && <p className="text-red-600">{error}</p>}
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={isPending || files.length === 0}
              icon={<FontAwesomeIcon icon={faFloppyDisk} />}
              iconPosition="right"
            >
              Save
            </Button>
          </div>
        </div>
        {validationErrors.length > 0 && (
          <div className="border border-red-300 rounded p-4 bg-red-50">
            <p className="font-semibold text-red-700 mb-2">
              The following errors must be resolved before saving:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-red-700">
              {validationErrors.map((err, i) => (
                <li key={i}>
                  <span className="font-medium">{err.errorType}</span>
                  {err.record && (
                    <span className="text-red-600"> — {err.record}</span>
                  )}
                  {err.details && (
                    <span className="text-red-500">: {err.details}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
