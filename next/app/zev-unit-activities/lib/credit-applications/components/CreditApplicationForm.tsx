"use client";

import axios, { AxiosResponse } from "axios";
import Excel from "exceljs";
import { Dropzone } from "@/app/lib/components/Dropzone";
import { Button, StatusBanner } from "@/app/lib/components";
import { Modal } from "@/app/lib/components/Modal";
import { useRouter } from "next/navigation";
import { JSX, useCallback, useEffect, useState, useTransition } from "react";
import { FileWithPath } from "react-dropzone";
import { CreditApplicationSupplierStatus } from "@/prisma/generated/enums";
import {
  getCreditApplicationAttachmentPutData,
  getCreditApplicationPutData,
  getSupplierEligibleVehicles,
  getSupplierTemplateDownloadUrl,
  supplierDelete,
  supplierSave,
} from "../actions";
import { SupplierTemplate } from "../constants";
import { getModelYearEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { downloadBuffer, getFiles } from "@/app/lib/utils/download";
import { Routes } from "@/app/lib/constants";
import { Attachment, AttachmentDownload } from "@/app/lib/constants/attachment";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faFloppyDisk, faTrash } from "@fortawesome/free-solid-svg-icons";

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
  const [modal, setModal] = useState<JSX.Element | null>(null);

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
    router.push(Routes.CreditApplications);
  }, [router]);

  const handleDelete = useCallback(async () => {
    if (!props.creditApplication?.id) return;
    const response = await supplierDelete(props.creditApplication.id);
    if (response.responseType === "error") {
      setError(response.message);
    } else {
      router.push(Routes.CreditApplications);
    }
    setModal(null);
  }, [props.creditApplication?.id, router]);

  const showDeleteModal = useCallback(() => {
    setModal(
      <Modal
        showModal={true}
        modalType="error"
        handleSubmit={handleDelete}
        handleCancel={() => setModal(null)}
      />,
    );
  }, [handleDelete]);

  const fileSize = files[0] ? (files[0].size / 1024).toFixed(1) : "0";

  const getStatusBanner = () => {
    if (!props.supplierStatus || props.supplierStatus === CreditApplicationSupplierStatus.DRAFT) {
      return (
        <StatusBanner
          title="STATUS - Draft"
          primaryText=""
        />
      );
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
        return (
          <StatusBanner
            title="STATUS - Draft"
            primaryText=""
          />
        );
    }
  };

  return (
    <div className="bg-white">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">
          {props.creditApplication?.id
            ? `Credit Application ID ${props.creditApplication.id}`
            : "New Credit Application"}
        </h1>
        <Button
          variant="secondary"
          onClick={handlePrintDownload}
          icon={<FontAwesomeIcon icon={faDownload} />}
        >
          Print/Download Page
        </Button>
      </div>

      <div className="px-6 pt-4 pb-2">
        {getStatusBanner()}
      </div>

      <div className="px-6 pb-6 pt-4 space-y-6">
        {error && <p className="text-red-600">{error}</p>}
        
        <div className="border border-gray-300 bg-gray-50 rounded max-w-sm">
          <div className="p-6">
            <h2 className="text-base font-bold mb-4 text-gray-900">Supplier Information</h2>
            <div className="space-y-2 text-sm text-gray-900">
              <div>
                <span className="font-semibold">Legal Name:</span> {props.legalName}
              </div>
              <div>
                <span className="font-semibold">Record Address:</span> {props.recordsAddress}
              </div>
              <div>
                <span className="font-semibold">Service Address:</span> {props.serviceAddress}
              </div>
              <div>
                <span className="font-semibold">Makes:</span> {props.makes}
              </div>
            </div>
          </div>
        </div>

        <div className="border border-gray-300 bg-white rounded">
          <div className="p-4 bg-gray-100 border-b border-gray-300">
            <h2 className="text-base font-bold text-gray-900">Credit Application Details</h2>
          </div>
          
          <div className="p-6 border-b border-gray-300">
            <h3 className="text-sm font-bold mb-2 text-gray-900">Step 1: Download the Credit Application Template</h3>
            <p className="text-sm text-gray-700 mb-3">
              Use this template to complete your credit application before uploading.
            </p>
            <Button
              variant="secondary"
              onClick={handleDownload}
              disabled={isPending}
              icon={<FontAwesomeIcon icon={faDownload} />}
            >
              Download Template
            </Button>
          </div>

          <div className="p-6">
            <h3 className="text-sm font-bold mb-2 text-gray-900">Step 2: Upload Credit Application</h3>
            <p className="text-sm text-gray-700 mb-3">
              Upload the completed file using template above.
            </p>

            {showUploadSuccess && files.length > 0 ? (
              <>
                <StatusBanner
                  title="File uploaded successfully."
                  primaryText="Review the data below before saving. To upload a new file, delete the current one."
                />
                <div className="mt-3 border-2 border-dashed border-gray-200 rounded bg-gray-50 p-8 pointer-events-none opacity-60">
                  <Dropzone
                    files={[]}
                    setFiles={setFiles}
                    disabled
                    maxNumberOfFiles={1}
                  />
                </div>
                <table className="w-full mt-3 text-sm">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="text-left py-2 font-semibold">Uploaded File</th>
                      <th className="text-left py-2 font-semibold">Size</th>
                      <th className="text-right py-2 font-semibold">Delete</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-2">{files[0].name}</td>
                      <td className="py-2">{fileSize} KB</td>
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
              <div className="border-2 border-dashed border-gray-300 rounded bg-white p-8">
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

        <div className="border border-gray-300 bg-white rounded">
          <div className="p-4 bg-gray-100 border-b border-gray-300">
            <h2 className="text-base font-bold text-gray-900">Supporting Documents (optional)</h2>
          </div>
          <div className="p-6">
            <div className="border-2 border-dashed border-gray-300 rounded bg-white p-8">
              <Dropzone
                files={attachments}
                setFiles={setAttachments}
                disabled={isPending}
                maxNumberOfFiles={10}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pb-6">
          <Button
            variant="secondary"
            onClick={handleBack}
            disabled={isPending}
          >
            ← Back
          </Button>
          {props.creditApplication?.id && (
            <Button
              variant="danger"
              onClick={showDeleteModal}
              disabled={isPending}
              icon={<FontAwesomeIcon icon={faTrash} />}
              iconPosition="right"
            >
              Delete
            </Button>
          )}
          <div className="flex-1" />
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
        {modal}
      </div>
    </div>
  );
};
