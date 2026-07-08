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
import {
  faDownload,
  faFloppyDisk,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { PrintDownloadButton } from "@/app/lib/components/PrintDownloadButton";

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
  const [showUploadSuccess, setShowUploadSuccess] = useState(false);

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
        setShowUploadSuccess(true);
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
    <div className="flex flex-col items-start self-stretch gap-4">
      <div className="flex self-stretch items-center justify-between p-5 rounded-t bg-[#E7E7E7]">
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
      <div className="self-stretch h-px bg-dividerMedium"></div>

      <div className="flex flex-col items-start gap-6 self-stretch bg-white">
        {error && <p className="text-red-600">{error}</p>}

        <div className="flex items-start gap-6 shadow-[0_2px_4px_0_rgba(0,0,0,0.08)]">
          <div className="flex w-[619px] flex-col items-start rounded-sm border border-dividerMedium">
            <div className="flex flex-col items-start self-stretch gap-1 rounded-t bg-disabledSurface px-5 py-4">
              <div className="self-stretch text-black text-xl leading-7 font-bold">
                Supplier Information
              </div>
            </div>
            <div className="flex flex-col items-start gap-5 rounded p-5 shadow-[0_4px_20px_0_rgba(177,177,177,0.10)]">
              <div className="flex flex-col items-start gap-3">
                <div className="flex items-center gap-4 self-stretch">
                  <div className="font-semibold w-[200px]">Legal Name:</div>{" "}
                  <div className="w-[345px]">{props.legalName}</div>
                </div>
                <div className="w-[561px] h-px bg-disabledSurface"></div>
                <div className="flex items-center gap-4 self-stretch">
                  <div className="font-semibold w-[200px]">Record Address:</div>{" "}
                  <div className="w-[345px]">{props.recordsAddress}</div>
                </div>
                <div className="w-[561px] h-px bg-disabledSurface"></div>
                <div className="flex items-center gap-4 self-stretch">
                  <div className="font-semibold w-[200px]">Service Address:</div>{" "}
                  <div className="w-[345px]">{props.serviceAddress}</div>
                </div>
                <div className="w-[561px] h-px bg-disabledSurface"></div>
                <div className="flex items-center gap-4 self-stretch">
                  <div className="font-semibold w-[200px]">Makes:</div>{" "}
                  <div className="w-[345px]">{props.makes}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start self-stretch rounded border border-dividerMedium shadow-[0_2px_4px_0_rgba(0,0,0,0.08)]">
          <div className="flex flex-col items-start self-stretch gap-1 rounded-t bg-disabledSurface px-5 py-4">
            <div className="self-stretch text-black text-xl leading-7 font-bold">
              Credit Application Details
            </div>
          </div>

          <div className="flex flex-col items-start self-stretch gap-2 px-5 py-4 rounded-t bg-[#F4F4F4]">
            <div className="self-stretch text-black text-sm font-bold">
              Step 1: Download the Credit Application Template
            </div>
            <p className="text-sm text-secondaryText">
              Use this template to complete your credit application before uploading.
            </p>
          </div>

          <div className="flex flex-col items-start self-stretch gap-5 p-5 rounded shadow-[0_4px_20px_0_rgba(177,177,177,0.10)]">
            <Button
              variant="secondary"
              onClick={handleDownload}
              disabled={isPending}
              icon={<FontAwesomeIcon icon={faDownload} />}
            >
              Download Template
            </Button>
          </div>

          <div className="self-stretch h-px bg-disabledSurface"></div>

          <div className="flex flex-col items-start self-stretch gap-2 px-5 py-4 rounded-t bg-[#F4F4F4]">
            <div className="self-stretch text-black text-sm font-bold">
              Step 2: Upload Credit Application
            </div>
            <p className="text-sm text-secondaryText">
              Upload the completed file using template above.
            </p>
          </div>

          <div className="flex flex-col items-start self-stretch gap-3 p-5">
            {showUploadSuccess && files.length > 0 ? (
              <>
                <StatusBanner
                  title="File uploaded successfully."
                  primaryText="Review the data below before saving. To upload a new file, delete the current one."
                />
                <div className="self-stretch pointer-events-none">
                  <Dropzone
                    files={[]}
                    setFiles={setFiles}
                    disabled
                    maxNumberOfFiles={1}
                  />
                </div>
                <div className="self-stretch h-px bg-disabledSurface"></div>
                <table className="w-full table-fixed text-sm">
                  <thead>
                    <tr className="border-gray-200">
                      <th className="w-1/3 text-left py-2 font-semibold">Uploaded File</th>
                      <th className="w-1/3 text-center py-2 font-semibold">Size</th>
                      <th className="w-1/3 text-right py-2 font-semibold">Delete</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-2">{files[0].name}</td>
                      <td className="py-2 text-center">{fileSize} KB</td>
                      <td className="py-2 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setFiles([]);
                            setShowUploadSuccess(false);
                          }}
                          disabled={isPending}
                          className="text-red-500 hover:text-red-700 disabled:opacity-50 bg-transparent border-none p-0"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </>
            ) : (
              <div className="self-stretch">
                <Dropzone
                  files={files}
                  setFiles={setFiles}
                  disabled={isPending}
                  maxNumberOfFiles={1}
                  allowedFileTypes={{
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
                      [".xlsx"],
                  }}
                  handleDrop={(acceptedFiles) => {
                    if (acceptedFiles.length > 0) {
                      setShowUploadSuccess(true);
                    }
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-start self-stretch gap-6 shadow-[0_2px_4px_0_rgba(0,0,0,0.08)]">
          <div className="flex flex-1 flex-col items-start rounded border border-dividerMedium">
            <div className="flex flex-col items-start self-stretch gap-1 rounded-t bg-disabledSurface px-5 py-4">
              <div className="self-stretch text-black text-xl leading-7 font-bold">
                Supporting Documents (optional)
              </div>
            </div>
            <div className="flex flex-col items-start self-stretch gap-3 p-5">
              <div className="self-stretch">
                <Dropzone
                  files={attachments}
                  setFiles={setAttachments}
                  disabled={isPending}
                  maxNumberOfFiles={10}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between self-stretch pb-2">
          <Button variant="secondary" onClick={handleBack} disabled={isPending}>
            ← Back
          </Button>
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
    </div>
  );
};
