"use client";

import { useCallback, useState, JSX } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/lib/components";
import { Modal, ModalType } from "@/app/lib/components/Modal";
import { deleteTransfer, submitTransfer } from "../actions";
import { Routes } from "@/app/lib/constants";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faPenToSquare,
  faTrash,
  faCircleArrowRight,
} from "@fortawesome/free-solid-svg-icons";

export const DraftTransferReview = (props: {
  id: number;
  transferFromSupplierName: string;
}) => {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [modal, setModal] = useState<JSX.Element | null>(null);
  const [confirmations, setConfirmations] = useState<
    [boolean, boolean, boolean]
  >([false, false, false]);

  const allConfirmed = confirmations.every(Boolean);

  const toggleConfirmation = useCallback((index: number) => {
    setConfirmations((prev) => {
      const next: [boolean, boolean, boolean] = [...prev] as [
        boolean,
        boolean,
        boolean,
      ];
      next[index] = !next[index];
      return next;
    });
  }, []);

  const authorityStatement = `I confirm that I am an officer or employee of ${props.transferFromSupplierName}, and that records evidencing my authority to submit this notice are available on request.`;

  const handleDelete = useCallback(async () => {
    setError("");
    try {
      await deleteTransfer(props.id);
      router.push(Routes.CreditTransfers);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      }
    }
    setModal(null);
  }, [props.id]);

  const handleSubmit = useCallback(async () => {
    setError("");
    try {
      const response = await submitTransfer(props.id, authorityStatement);
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
  }, [props.id, props.transferFromSupplierName]);

  const showModal = useCallback(
    (type: "delete" | "submit") => {
      let modalType: ModalType;
      let action: () => Promise<void>;
      if (type === "delete") {
        modalType = "error";
        action = handleDelete;
      } else {
        modalType = "confirmation";
        action = handleSubmit;
      }
      setModal(
        <Modal
          showModal={true}
          modalType={modalType}
          handleSubmit={action}
          handleCancel={() => setModal(null)}
        />,
      );
    },
    [handleDelete, handleSubmit],
  );

  const handleGoToEdit = useCallback(() => {
    router.push(`${Routes.CreditTransfers}/${props.id}/edit`);
  }, [props.id]);

  const handleBack = useCallback(() => {
    router.push(Routes.CreditTransfers);
  }, []);

  const statements = [
    authorityStatement,
    `${props.transferFromSupplierName} certifies that the information provided in this notice is accurate and complete.`,
    `${props.transferFromSupplierName} consents to the transfer of credits in this notice.`,
  ];

  return (
    <>
      {error && (
        <p className="rounded border border-error bg-red-50 px-4 py-2 text-sm text-error">
          {error}
        </p>
      )}
      <div className="flex self-stretch flex-col items-start rounded border border-dividerMedium">
        <div className="flex flex-col items-start gap-2 self-stretch p-5 rounded-t border-b border-dividerMedium bg-disabledSurface">
          <div className="self-stretch text-primaryText text-xl font-bold leading-7">
            Review &amp; Confirm
          </div>
          <div className="flex self-stretch items-start gap-3 px-4 py-3 rounded-sm border border-warning bg-[#FEF1D8]">
            Please review the statements below and confirm they are accurate
            before submitting.
          </div>
        </div>
        <div className="flex flex-col items-start gap-4 self-stretch p-5 rounded shadow-[0_4px_20px_0_rgba(177,177,177,0.10)]">
          {statements.map((statement, index) => (
            <label
              key={index}
              className="flex w-full cursor-pointer items-start gap-3 rounded border border-gray-200 p-4 hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={confirmations[index]}
                onChange={() => toggleConfirmation(index)}
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-primaryBlue"
              />
              <span className="text-sm text-primaryText">{statement}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="flex h-20 p-5 justify-between items-center self-stretch rounded border border-dividerMedium">
        <div className="flex w-[420.75px] items-center gap-6">
          <Button
            variant="secondary"
            onClick={handleBack}
            icon={
              <FontAwesomeIcon icon={faArrowLeft} className="h-3.5 w-3.5" />
            }
          >
            Back
          </Button>
          <Button
            variant="secondary"
            onClick={handleGoToEdit}
            icon={
              <FontAwesomeIcon icon={faPenToSquare} className="h-3.5 w-3.5" />
            }
          >
            Edit
          </Button>
          <Button
            variant="danger"
            onClick={() => showModal("delete")}
            icon={<FontAwesomeIcon icon={faTrash} className="h-3.5 w-3.5" />}
          >
            Delete
          </Button>
        </div>
        <div className="flex w-[726.5px] justify-end items-center gap-4">
          <Button
            variant="primary"
            disabled={!allConfirmed}
            onClick={() => showModal("submit")}
            icon={
              <FontAwesomeIcon
                icon={faCircleArrowRight}
                className="h-3.5 w-3.5"
              />
            }
            iconPosition="right"
          >
            Submit to Transfer Partner
          </Button>
        </div>
      </div>
      {modal}
    </>
  );
};
