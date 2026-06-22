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
  const [confirmations, setConfirmations] = useState<[boolean, boolean, boolean]>(
    [false, false, false],
  );

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
      const statement1 = `I confirm that I am an officer or employee of ${props.transferFromSupplierName}, and that records evidencing my authority to submit this notice are available on request.`;
      const response = await submitTransfer(props.id, statement1);
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
    `I confirm that I am an officer or employee of ${props.transferFromSupplierName}, and that records evidencing my authority to submit this notice are available on request.`,
    `${props.transferFromSupplierName} certifies that the information provided in this notice is accurate and complete.`,
    `${props.transferFromSupplierName} consents to the transfer of credits in this notice.`,
  ];

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="rounded border border-error bg-red-50 px-4 py-2 text-sm text-error">
          {error}
        </p>
      )}

      {/* Review & Confirm section */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-level-1">
        <div className="border-b border-gray-200 bg-gray-100 px-6 py-3">
          <span className="font-semibold text-primaryText">
            Review &amp; Confirm
          </span>
        </div>
        <div className="p-6">
          <div className="mb-4 rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Please review the statements below and confirm they are accurate
            before submitting.
          </div>
          <div className="flex flex-col gap-3">
            {statements.map((statement, index) => (
              <label
                key={index}
                className="flex cursor-pointer items-start gap-3 rounded border border-gray-200 p-4 hover:bg-gray-50"
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
      </div>

      {/* Footer action buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          onClick={handleBack}
          icon={<FontAwesomeIcon icon={faArrowLeft} className="h-3.5 w-3.5" />}
        >
          Back
        </Button>
        <div className="flex items-center gap-3">
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
    </div>
  );
};
