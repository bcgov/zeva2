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
import { getNormalizedComment } from "@/app/lib/utils/comment";
import { Routes } from "@/app/lib/constants";
import { Textarea } from "@/app/lib/components/inputs/Textarea";
import { ErrorsTemplate } from "../constants";
import { downloadBuffer } from "@/app/lib/utils/download";
import { Modal, ModalType } from "@/app/lib/components/Modal";

export const SupplierActions = (props: {
  creditApplicationId: number;
  status: CreditApplicationSupplierStatus;
  userRoles: Role[];
  hasInvalidatedRecords: boolean;
}) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [modal, setModal] = useState<JSX.Element | null>(null);

  const handleDelete = useCallback(async () => {
    const response = await supplierDelete(props.creditApplicationId);
    if (response.responseType === "error") {
      setError(response.message);
    } else {
      router.push(Routes.CreditApplications);
    }
    setModal(null);
  }, [props.creditApplicationId]);

  const handleGoToEdit = useCallback(() => {
    router.push(
      `${Routes.CreditApplications}/${props.creditApplicationId}/edit`,
    );
  }, [props.creditApplicationId]);

  const handleSubmit = useCallback(async () => {
    const response = await supplierSubmit(
      props.creditApplicationId,
      getNormalizedComment(comment),
    );
    if (response.responseType === "error") {
      setError(response.message);
    } else {
      router.refresh();
    }
    setModal(null);
  }, [props.creditApplicationId, comment]);

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

  if (props.status === CreditApplicationSupplierStatus.DRAFT) {
    return (
      <>
        {error && <p className="text-red-600">{error}</p>}
        <Textarea value={comment} onChange={setComment} />
        <Button variant="danger" onClick={() => showModal("delete")}>
          Delete
        </Button>
        <Button variant="secondary" onClick={handleGoToEdit}>
          Edit
        </Button>
        {props.userRoles.includes(Role.SIGNING_AUTHORITY) && (
          <>
            <Button variant="primary" onClick={() => showModal("submit")}>
              Submit
            </Button>
          </>
        )}
        {modal}
      </>
    );
  }
  if (props.status === CreditApplicationSupplierStatus.REJECTED) {
    return (
      <>
        <Button variant="danger" onClick={() => showModal("delete")}>
          Delete
        </Button>
        {modal}
      </>
    );
  }
  if (
    props.status === CreditApplicationSupplierStatus.APPROVED &&
    props.hasInvalidatedRecords
  ) {
    return (
      <>
        <Button
          variant="primary"
          onClick={handleDownloadErrors}
          disabled={isPending}
        >
          {isPending ? "..." : "Download VIN Errors"}
        </Button>
        {modal}
      </>
    );
  }
  return null;
};
