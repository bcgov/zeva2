"use client";

import { Button, StatusBanner } from "@/app/lib/components";
import { Routes } from "@/app/lib/constants";
import { useRouter } from "next/navigation";
import { JSX, useCallback, useMemo, useState } from "react";
import { deleteReports, submitReports } from "../actions";
import { getNormalizedComment } from "@/app/lib/utils/comment";
import { ModelYear, ModelYearReportStatus } from "@/prisma/generated/enums";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { getModelYearEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { Modal, ModalType } from "@/app/lib/components/Modal";
import { CommentBox } from "@/app/lib/components/CommentBox";
import { BackButton } from "@/app/lib/components/BackButton";

export const SupplierActions = (props: {
  myrId: number;
  status: ModelYearReportStatus;
  modelYear: ModelYear;
  supplierName: string;
}) => {
  const router = useRouter();
  const [comment, setComment] = useState<string>("");
  const [checkboxesStatus, setCheckboxesStatus] = useState<[boolean, boolean]>([
    false,
    false,
  ]);
  const [error, setError] = useState<string>("");
  const [modal, setModal] = useState<JSX.Element | null>(null);

  const handleCheck = useCallback((index: 0 | 1) => {
    if (index === 0) {
      setCheckboxesStatus((prev) => {
        return [!prev[0], prev[1]];
      });
    } else if (index === 1) {
      setCheckboxesStatus((prev) => {
        return [prev[0], !prev[1]];
      });
    }
  }, []);

  const handleGoToEdit = useCallback(() => {
    router.push(`${Routes.ModelYearReports}/${props.myrId}/edit`);
  }, [props.myrId]);

  const handleSubmit = useCallback(async () => {
    setError("");
    try {
      const response = await submitReports(
        props.myrId,
        getNormalizedComment(comment),
      );
      if (response.responseType === "error") {
        throw new Error(response.message);
      }
      router.refresh();
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      }
    }
    setModal(null);
  }, [props.myrId, comment]);

  const handleDelete = useCallback(async () => {
    setError("");
    try {
      const response = await deleteReports(props.myrId);
      if (response.responseType === "error") {
        throw new Error(response.message);
      }
      router.push(Routes.ModelYearReports);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      }
    }
    setModal(null);
  }, [props.myrId]);

  const salesOrSupplied = useMemo(() => {
    if (props.modelYear < ModelYear.MY_2024) {
      return "Consumer Sales";
    } else {
      return "Consumer Vehicles Supplied";
    }
  }, [props.modelYear]);

  const modelYearsMap = useMemo(() => {
    return getModelYearEnumsToStringsMap();
  }, []);

  const checkboxes = useMemo(() => {
    let disabledAndChecked = true;
    if (
      props.status === ModelYearReportStatus.DRAFT ||
      props.status === ModelYearReportStatus.RETURNED_TO_SUPPLIER
    ) {
      disabledAndChecked = false;
    }
    return (
      <div className="p-5 flex flex-col gap-5">
        <div className="px-4 py-3 flex flex-row gap-3 border border-dividerMedium rounded">
          <input
            type="checkbox"
            checked={disabledAndChecked ? true : checkboxesStatus[0]}
            onChange={() => handleCheck(0)}
            disabled={disabledAndChecked}
          />
          <span className="font-bold">
            I confirm that all required {salesOrSupplied} credit applications
            for {modelYearsMap[props.modelYear]} model year vehicles have been
            submitted.
          </span>
        </div>
        <div className="px-4 py-3 flex flex-row gap-3 border border-dividerMedium">
          <input
            type="checkbox"
            checked={disabledAndChecked ? true : checkboxesStatus[1]}
            onChange={() => handleCheck(1)}
            disabled={disabledAndChecked}
          />
          <span className="font-bold">
            On behalf of {props.supplierName}, I confirm that information
            included in this report is complete and accurate.
          </span>
        </div>
      </div>
    );
  }, [
    checkboxesStatus,
    props.status,
    props.modelYear,
    props.supplierName,
    salesOrSupplied,
  ]);

  const showModal = useCallback(
    (type: "submit" | "delete") => {
      let modalType: ModalType | undefined;
      let action: (() => Promise<void>) | undefined;
      if (type === "submit") {
        modalType = "confirmation";
        action = handleSubmit;
      } else if (type === "delete") {
        modalType = "error";
        action = handleDelete;
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
    [handleSubmit, handleDelete],
  );

  if (
    props.status === ModelYearReportStatus.DRAFT ||
    props.status === ModelYearReportStatus.RETURNED_TO_SUPPLIER
  ) {
    return (
      <div className="flex flex-col gap-4">
        <CommentBox comment={comment} setComment={setComment} />
        <div className="flex flex-col border border-dividerMedium rounded">
          <div className="flex flex-col gap-2 p-5 bg-disabledBG">
            <span className="font-bold text-xl">
              Confirmation before Submission
            </span>
            <StatusBanner
              variant="warning"
              title="Before submitting, please review the statements below and confirm that they are true."
              primaryText=""
            />
          </div>
          {checkboxes}
        </div>
        <div className="flex flex-row p-5 bg-lightGrey justify-between">
          <div className="flex flex-row gap-4 items-center">
            <BackButton route={`${Routes.ModelYearReports}/${props.myrId}/edit`} />
            <Button
              onClick={() => showModal("delete")}
              variant="danger"
              icon={<FontAwesomeIcon icon={faTrash} />}
              iconPosition="right"
            >
              Delete
            </Button>
            <Button onClick={handleGoToEdit} variant="secondary">
              Start Over
            </Button>
          </div>
          <div className="flex flex-row gap-4 items-center">
            {error && <span className="text-red-600">{error}</span>}
            <Button
              onClick={() => showModal("submit")}
              variant="primary"
              icon={<FontAwesomeIcon icon={faPaperPlane} />}
              iconPosition="right"
              disabled={checkboxesStatus.includes(false)}
            >
              Submit
            </Button>
          </div>
        </div>
        {modal}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col border border-dividerMedium rounded">
        <div className="p-5 bg-disabledBG font-bold text-xl">
          Confirmation before Submission
        </div>
        {checkboxes}
      </div>
      <div className="flex flex-row p-5 bg-lightGrey">
        <BackButton route={`${Routes.ModelYearReports}`} />
      </div>
    </div>
  );
};
