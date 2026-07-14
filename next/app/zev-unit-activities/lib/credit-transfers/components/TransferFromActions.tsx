"use client";

import { Button } from "@/app/lib/components";
import { Textarea } from "@/app/lib/components/inputs/Textarea";
import { useRouter } from "next/navigation";
import { JSX, useCallback, useMemo, useState } from "react";
import { deleteTransfer, rescindTransfer, submitTransfer } from "../actions";
import { getNormalizedComment } from "@/app/lib/utils/comment";
import { Routes } from "@/app/lib/constants";
import { Modal, ModalType } from "@/app/lib/components/Modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

export const TransferFromActions = (props: {
  id: number;
  type: "draft" | "rescindable";
  transferFromSupplierName: string;
}) => {
  const router = useRouter();
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [modal, setModal] = useState<JSX.Element | null>(null);
  const [confirmations, setConfirmations] = useState<
    [boolean, boolean, boolean]
  >([false, false, false]);

  const signingStatements = useMemo(() => {
    const authorityStatement = `I confirm that I am an officer or employee of ${props.transferFromSupplierName}, and that records evidencing my authority to submit this notice are available on request.`;
    return {
      authorityStatement,
      statements: [
        authorityStatement,
        `${props.transferFromSupplierName} certifies that the information provided in this notice is accurate and complete.`,
        `${props.transferFromSupplierName} consents to the transfer of credits in this notice.`,
      ],
    };
  }, [props.transferFromSupplierName]);

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

  const handleRescindOrSubmit = useCallback(
    async (type: "rescind" | "submit") => {
      setError("");
      try {
        let response;
        switch (type) {
          case "rescind":
            response = await rescindTransfer(
              props.id,
              getNormalizedComment(comment),
            );
            break;
          case "submit":
            response = await submitTransfer(
              props.id,
              signingStatements.authorityStatement,
              getNormalizedComment(comment),
            );
            break;
        }
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
    },
    [props.id, signingStatements, comment],
  );

  const handleGoToEdit = useCallback(() => {
    router.push(`${Routes.CreditTransfers}/${props.id}/edit`);
  }, [props.id]);

  const handleBack = useCallback(() => {
    router.push(Routes.CreditTransfers);
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

  const showModal = useCallback(
    (type: "rescind" | "submit" | "delete") => {
      let modalType: ModalType | undefined;
      let action: (() => Promise<void>) | undefined;
      if (type === "rescind") {
        modalType = "error";
        action = () => handleRescindOrSubmit("rescind");
      } else if (type === "submit") {
        modalType = "confirmation";
        action = () => handleRescindOrSubmit("submit");
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
    [handleRescindOrSubmit, handleDelete],
  );

  switch (props.type) {
    case "draft":
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
              {signingStatements.statements.map((statement, index) => (
                <label
                  key={statement}
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
            <div className="flex items-center gap-6">
              <Button variant="danger" onClick={() => showModal("delete")}>
                Delete
              </Button>
              <Button variant="secondary" onClick={handleGoToEdit}>
                Edit
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="primary"
                disabled={!allConfirmed}
                onClick={() => showModal("submit")}
              >
                Submit to Transfer Partner
              </Button>
            </div>
          </div>
          {modal}
        </>
      );
    case "rescindable":
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
                Rescind Credit Transfer
              </div>
              <div className="self-stretch text-secondaryText text-sm font-normal leading-5">
                If you need to rescind this credit transfer notice please enter
                a reason to your transfer partner.
              </div>
            </div>
            <div className="flex flex-col items-start gap-4 self-stretch p-5 rounded-b shadow-[0_4px_20px_0_rgba(177,177,177,0.10)]">
              <Textarea value={comment} onChange={setComment} />
            </div>
          </div>
          <div className="flex h-20 p-5 justify-between items-center self-stretch rounded border border-dividerMedium">
            <Button
              variant="secondary"
              onClick={handleBack}
              icon={
                <FontAwesomeIcon icon={faArrowLeft} className="h-3.5 w-3.5" />
              }
            >
              Back
            </Button>
            <Button variant="danger" onClick={() => showModal("rescind")}>
              Rescind Notice
            </Button>
          </div>
          {modal}
        </>
      );
  }
};
