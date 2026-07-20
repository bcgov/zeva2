"use client";

import axios from "axios";
import Excel from "exceljs";
import { Button } from "@/app/lib/components";
import {
  CreditApplicationSupplierStatus,
  Role,
} from "@/prisma/generated/enums";
import { useRouter } from "next/navigation";
import { JSX, useCallback, useState, useTransition } from "react";
import {
  getErrorsTemplateDownloadUrl,
  getNotValidatedRecords,
  supplierDelete,
  supplierSubmit,
} from "../actions";
import { Routes } from "@/app/lib/constants";
import { ErrorsTemplate } from "../constants";
import { downloadBuffer } from "@/app/lib/utils/download";
import { Modal, ModalType } from "@/app/lib/components/Modal";
import { getNormalizedComment } from "@/app/lib/utils/comment";
import { CommentBox } from "@/app/lib/components/CommentBox";
import { ValidationError } from "@/app/lib/utils/actionResponse";

export const SupplierActions = (props: {
  creditApplicationId: number;
  status: CreditApplicationSupplierStatus;
  userRoles: Role[];
  hasInvalidatedRecords: boolean;
}) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    [],
  );
  const [comment, setComment] = useState<string>("");
  const [modal, setModal] = useState<JSX.Element | null>(null);

  const handleBack = useCallback(() => {
    router.push(Routes.CreditApplications);
  }, [router]);

  const handleDelete = useCallback(async () => {
    const response = await supplierDelete(props.creditApplicationId);
    if (response.responseType === "error") {
      setError(response.message);
    } else {
      router.push(Routes.CreditApplications);
    }
    setModal(null);
  }, [props.creditApplicationId, router]);

  const handleGoToEdit = useCallback(() => {
    router.push(
      `${Routes.CreditApplications}/${props.creditApplicationId}/edit`,
    );
  }, [props.creditApplicationId, router]);

  const handleSubmit = useCallback(async () => {
    setError("");
    setValidationErrors([]);
    const response = await supplierSubmit(
      props.creditApplicationId,
      getNormalizedComment(comment),
    );
    if (response.responseType === "validationErrors") {
      setValidationErrors(response.errors);
    } else if (response.responseType === "error") {
      setError(response.message);
    } else {
      router.refresh();
    }
    setModal(null);
  }, [props.creditApplicationId, comment, router]);

  const handleDownloadErrors = useCallback(() => {
    startTransition(async () => {
      try {
        const [templateUrl, recordsResponse] = await Promise.all([
          getErrorsTemplateDownloadUrl(),
          getNotValidatedRecords(props.creditApplicationId),
        ]);
        const templateResponse = await axios.get(templateUrl, {
          responseType: "arraybuffer",
        });
        const template = templateResponse.data;
        const workbook = new Excel.Workbook();
        await workbook.xlsx.load(template);
        const errorsSheet = workbook.getWorksheet(
          ErrorsTemplate.ErrorsSheetName,
        );
        if (errorsSheet && recordsResponse.responseType === "data") {
          for (const [index, record] of recordsResponse.data.entries()) {
            const row = errorsSheet.getRow(index + 2);
            row.getCell(1).value = record.vin;
            row.getCell(2).value = record.make;
            row.getCell(3).value = record.modelName;
            row.getCell(4).value = record.modelYear;
            row.getCell(5).value = record.date;
            row.getCell(6).value = record.error;
          }
          const buffer = await workbook.xlsx.writeBuffer();
          const fileName = `credit-application-VIN-errors-${props.creditApplicationId}.xlsx`;
          downloadBuffer(fileName, buffer);
        } else {
          setError("Something went wrong!");
        }
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, [props.creditApplicationId]);

  const showModal = useCallback(
    (type: "delete" | "submit") => {
      let modalType: ModalType | undefined;
      let action: (() => Promise<void>) | undefined;
      if (type === "delete") {
        modalType = "error";
        action = handleDelete;
      } else if (type === "submit") {
        modalType = "confirmation";
        action = handleSubmit;
      }
      if (modalType && action) {
        setModal(
          <Modal
            showModal={true}
            modalType={modalType}
            handleSubmit={action}
            handleCancel={() => setModal(null)}
          />,
        );
      }
    },
    [handleDelete, handleSubmit],
  );

  const isSigningAuthority = props.userRoles.includes(Role.SIGNING_AUTHORITY);

  const validationErrorsList =
    validationErrors.length > 0 ? (
      <div className="border border-red-300 rounded p-4 bg-red-50 mx-5 mb-2">
        <p className="font-semibold text-red-700 mb-2">
          Please resolve the following errors before submitting:
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
    ) : null;

  if (props.status === CreditApplicationSupplierStatus.DRAFT) {
    return (
      <>
        {isSigningAuthority && (
          <CommentBox comment={comment} setComment={setComment} />
        )}

        <div className="flex flex-row items-center justify-between p-5 bg-lightGrey">
          <div className="flex flex-row items-center gap-4">
            <Button variant="secondary" onClick={handleBack}>
              ← Back
            </Button>
            <Button variant="danger" onClick={() => showModal("delete")}>
              Delete
            </Button>
            <Button variant="secondary" onClick={handleGoToEdit}>
              Edit
            </Button>
          </div>
          {isSigningAuthority && (
            <div className="flex flex-row items-center gap-4">
              {error && <p className="text-red-600 mb-2">{error}</p>}
              <Button variant="primary" onClick={() => showModal("submit")}>
                Submit
              </Button>
            </div>
          )}
          {modal}
        </div>
        {validationErrorsList}
      </>
    );
  }

  if (props.status === CreditApplicationSupplierStatus.SUBMITTED) {
    return (
      <div className="flex flex-row items-center justify-start p-5 bg-lightGrey">
        <Button variant="secondary" onClick={handleBack}>
          ← Back
        </Button>
      </div>
    );
  }

  if (props.status === CreditApplicationSupplierStatus.REJECTED) {
    return (
      <div className="flex flex-row items-center justify-between p-5 bg-lightGrey">
        <Button variant="secondary" onClick={handleBack}>
          ← Back
        </Button>
        <div className="flex flex-row items-center gap-4">
          {error && <p className="text-red-600 mb-2">{error}</p>}
          <Button variant="danger" onClick={() => showModal("delete")}>
            Delete
          </Button>
        </div>
        {modal}
      </div>
    );
  }

  if (
    props.status === CreditApplicationSupplierStatus.APPROVED &&
    props.hasInvalidatedRecords
  ) {
    return (
      <div className="flex flex-row items-center justify-between p-5 bg-lightGrey">
        <Button variant="secondary" onClick={handleBack}>
          ← Back
        </Button>
        <div className="flex flex-row items-center gap-4">
          {error && <p className="text-red-600 mb-2">{error}</p>}
          <Button
            variant="primary"
            onClick={handleDownloadErrors}
            disabled={isPending}
          >
            {isPending ? "..." : "Download VIN Errors"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-row items-center justify-start p-5 bg-lightGrey">
      <Button variant="secondary" onClick={handleBack}>
        ← Back
      </Button>
    </div>
  );
};
