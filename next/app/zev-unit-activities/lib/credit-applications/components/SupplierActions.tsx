"use client";

import axios from "axios";
import Excel from "exceljs";
import { Button } from "@/app/lib/components";
import {
  CreditApplicationSupplierStatus,
  Role,
} from "@/prisma/generated/enums";
import { useRouter } from "next/navigation";
import { JSX, useCallback, useMemo, useState, useTransition } from "react";
import {
  getErrorsTemplateDownloadUrl,
  getNotValidatedRecords,
  supplierDelete,
  supplierSubmit,
} from "../actions";
import { Routes } from "@/app/lib/constants";
import { ErrorsTemplate, impermissableCaSubmissionMsg } from "../constants";
import { downloadBuffer } from "@/app/lib/utils/download";
import { Modal, ModalType } from "@/app/lib/components/Modal";
import { getNormalizedComment } from "@/app/lib/utils/comment";
import { CommentBox } from "@/app/lib/components/CommentBox";
import { ValidationResults } from "./ValidationResults";
import { getCaDataFinal } from "../utilsClient";

export const SupplierActions = (props: {
  creditApplicationId: number;
  status: CreditApplicationSupplierStatus;
  userRoles: Role[];
  hasInvalidatedRecords: boolean;
}) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [validationResults, setValidationResults] = useState<{
    eligibleWorkbook: Excel.Workbook | null;
    eligibleCount: number;
    ineligibleWorkbook: Excel.Workbook | null;
    ineligibleCount: number;
  }>();
  const [impermissableCaMsg, setImpermissableCaMsg] =
    useState<JSX.Element | null>(null);
  const [comment, setComment] = useState<string>("");
  const [modal, setModal] = useState<JSX.Element | null>(null);

  const impermissableCaMsgToUse = useMemo(() => {
    return (
      <div className="flex flex-col gap-4 p-4 border border-red-300 rounded bg-red-50 text-red-700">
        <h2 className="font-bold text-lg">
          You cannot submit this Credit Application. The following information
          may be helpful:
        </h2>
        <ol className="flex flex-col gap-4 list-decimal list-inside">
          <li>
            Suppose it is currently year Y, and that the current date is between
            Oct.1st, Y, and Oct.20th, Y (inclusive). Then all records in the
            credit application (CA) must have a date that is on or before
            September 30th, Y. Also, for each record in the CA, if the record
            has a model year X that is before Y - 1, then it must have a date
            that is after Sep.30th, X + 1. Also, your organization must not have
            a Model Year Report associated with model year Y - 1.
          </li>
          <li>
            Suppose it is currently year Y, and that the current date is between
            Oct.21st, Y, and Sep.30th, Y + 1. Also suppose this CA is meant to
            be a "regular" CA. Then, for each record in the CA, if the record
            has a model year X that is before Y, then it must have a date that
            is after Sep.30th, X + 1. Also, your organization must not have a
            Model Year Report associated with model year Y.
          </li>
          <li>
            Suppose it is currently year Y, and that the current date is between
            Oct.21st, Y, and Sep.30th, Y + 1. Also suppose this CA is meant to
            be a "supplementary" CA. Then every record in the CA must have the
            same model year X, and this model year must be before Y. Also, for
            each record in the CA, the record must have a date that is on or
            before September 30th, X + 1. Also, your organization must have an
            assessed Model Year Report associated with model year X.
          </li>
          <li>
            If the CA does not fall into one of the 3 "scenarios" above, then
            you may not submit the CA.
          </li>
        </ol>
      </div>
    );
  }, []);

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
    setValidationResults(undefined);
    setImpermissableCaMsg(null);
    const response = await supplierSubmit(
      props.creditApplicationId,
      getNormalizedComment(comment),
    );
    if (response.responseType === "data") {
      const { records, subTemplateUrl } = response.data;
      const caData = await getCaDataFinal(records, subTemplateUrl);
      const caDataType = caData.type;
      if (caDataType === "eligibleIneligible" || caDataType === "ineligible") {
        setError("Ineligible records found; please see above!");
        if (caDataType === "eligibleIneligible") {
          setValidationResults({
            eligibleWorkbook: caData.eligibleWorkbook,
            eligibleCount: caData.eligibleCount,
            ineligibleWorkbook: caData.ineligibleWorkbook,
            ineligibleCount: caData.ineligibleCount,
          });
        } else {
          setValidationResults({
            eligibleWorkbook: null,
            eligibleCount: 0,
            ineligibleWorkbook: caData.ineligibleWorkbook,
            ineligibleCount: caData.ineligibleCount,
          });
        }
      }
    } else if (response.responseType === "error") {
      const msg = response.message;
      if (msg === impermissableCaSubmissionMsg) {
        setImpermissableCaMsg(impermissableCaMsgToUse);
        setError("Impermissable Applciation; please see above!");
      } else {
        setError(response.message);
      }
    } else {
      router.refresh();
    }
    setModal(null);
  }, [props.creditApplicationId, comment, router, impermissableCaMsgToUse]);

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

  if (props.status === CreditApplicationSupplierStatus.DRAFT) {
    return (
      <>
        {validationResults && (
          <ValidationResults
            eligibleWorkbook={validationResults.eligibleWorkbook}
            eligibleCount={validationResults.eligibleCount}
            ineligibleWorkbook={validationResults.ineligibleWorkbook}
            ineligibleCount={validationResults.ineligibleCount}
            disabled={isPending}
          />
        )}

        {impermissableCaMsg}

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
      </>
    );
  }

  if (
    props.status === CreditApplicationSupplierStatus.ISSUED &&
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
