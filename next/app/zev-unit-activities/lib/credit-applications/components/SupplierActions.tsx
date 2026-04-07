"use client";

import axios from "axios";
import Excel from "exceljs";
import { Button } from "@/app/lib/components";
import {
  CreditApplicationSupplierStatus,
  ModelYear,
  Role,
} from "@/prisma/generated/enums";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import {
  getErrorsTemplateDownloadUrl,
  getNotValidatedRecords,
  supplierDelete,
  supplierSubmit,
} from "../actions";
import { getNormalizedComment } from "@/app/lib/utils/comment";
import { Routes } from "@/app/lib/constants";
import { Textarea } from "@/app/lib/components/inputs/Textarea";
import { getModelYearEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { ErrorsTemplate } from "../constants";
import { downloadBuffer } from "@/app/lib/utils/download";

export const SupplierActions = (props: {
  creditApplicationId: number;
  status: CreditApplicationSupplierStatus;
  userRoles: Role[];
  partOfMyrModelYear: ModelYear | null;
}) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string>("");

  const modelYearsMap = useMemo(() => {
    return getModelYearEnumsToStringsMap();
  }, []);

  const handleDelete = useCallback(() => {
    startTransition(async () => {
      const response = await supplierDelete(props.creditApplicationId);
      if (response.responseType === "error") {
        setError(response.message);
      } else {
        router.push(Routes.CreditApplication);
      }
    });
  }, [props.creditApplicationId]);

  const handleGoToEdit = useCallback(() => {
    router.push(
      `${Routes.CreditApplication}/${props.creditApplicationId}/edit`,
    );
  }, [props.creditApplicationId]);

  const handleSubmit = useCallback(
    (partOfMyr: boolean) => {
      startTransition(async () => {
        const response = await supplierSubmit(
          props.creditApplicationId,
          partOfMyr,
          getNormalizedComment(comment),
        );
        if (response.responseType === "error") {
          setError(response.message);
        } else {
          router.refresh();
        }
      });
    },
    [props.creditApplicationId, comment],
  );

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

  if (props.status === CreditApplicationSupplierStatus.DRAFT) {
    return (
      <>
        {error && <p className="text-red-600">{error}</p>}
        <Textarea value={comment} onChange={setComment} disabled={isPending} />
        <Button variant="danger" onClick={handleDelete} disabled={isPending}>
          {isPending ? "..." : "Delete"}
        </Button>
        <Button
          variant="secondary"
          onClick={handleGoToEdit}
          disabled={isPending}
        >
          {isPending ? "..." : "Edit"}
        </Button>
        {props.userRoles.includes(Role.SIGNING_AUTHORITY) && (
          <>
            <Button
              variant="primary"
              onClick={() => handleSubmit(false)}
              disabled={isPending}
            >
              {isPending ? "..." : "Submit"}
            </Button>
            {props.partOfMyrModelYear && (
              <Button
                variant="primary"
                onClick={() => handleSubmit(true)}
                disabled={isPending}
              >
                {isPending
                  ? "..."
                  : `Submit as part of ${modelYearsMap[props.partOfMyrModelYear]} Model Year Report`}
              </Button>
            )}
          </>
        )}
      </>
    );
  }
  if (props.status === CreditApplicationSupplierStatus.REJECTED) {
    return (
      <Button variant="danger" onClick={handleDelete} disabled={isPending}>
        {isPending ? "..." : "Delete"}
      </Button>
    );
  }
  if (props.status === CreditApplicationSupplierStatus.APPROVED) {
    return (
      <Button
        variant="primary"
        onClick={handleDownloadErrors}
        disabled={isPending}
      >
        {isPending ? "..." : "Download VIN Errors"}
      </Button>
    );
  }
  return null;
};
