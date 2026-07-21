"use client";

import { Button } from "@/app/lib/components";
import { Textarea } from "@/app/lib/components/inputs/Textarea";
import { CreditTransferStatus } from "@/prisma/generated/enums";
import { useRouter } from "next/navigation";
import { JSX, useCallback, useMemo, useState } from "react";
import { transferToSupplierActionTransfer } from "../actions";
import { getNormalizedComment } from "@/app/lib/utils/comment";
import { Modal, ModalType } from "@/app/lib/components/Modal";

export const TransferToActions = (props: {
  id: number;
  transferToSupplierName: string;
}) => {
  const router = useRouter();
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [modal, setModal] = useState<JSX.Element | null>(null);
  const [confirmations, setConfirmations] = useState<
    [boolean, boolean, boolean]
  >([false, false, false]);

  const signingStatements = useMemo(() => {
    const authorityStatement = `I confirm that I am an officer or employee of ${props.transferToSupplierName}, and that records evidencing my authority to submit this notice are available on request.`;
    return {
      authorityStatement,
      statements: [
        authorityStatement,
        `${props.transferToSupplierName} certifies that the information provided in this notice is accurate and complete.`,
        `${props.transferToSupplierName} consents to the transfer of credits in this notice.`,
      ],
    };
  }, [props.transferToSupplierName]);

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

  const handleApproveOrReject = useCallback(
    async (status: CreditTransferStatus) => {
      setError("");
      try {
        const response = await transferToSupplierActionTransfer(
          props.id,
          status,
          status === CreditTransferStatus.APPROVED_BY_TRANSFER_TO
            ? signingStatements.authorityStatement
            : undefined,
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
    },
    [props.id, signingStatements, comment],
  );

  const showModal = useCallback(
    (type: "approve" | "reject") => {
      let modalType: ModalType | undefined;
      let action: (() => Promise<void>) | undefined;
      if (type === "approve") {
        modalType = "confirmation";
        action = () =>
          handleApproveOrReject(CreditTransferStatus.APPROVED_BY_TRANSFER_TO);
      } else if (type === "reject") {
        modalType = "error";
        action = () =>
          handleApproveOrReject(CreditTransferStatus.REJECTED_BY_TRANSFER_TO);
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
    [handleApproveOrReject],
  );

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
            before approving.
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
        <div className="flex items-center gap-4">
          <Button variant="danger" onClick={() => showModal("reject")}>
            Reject
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="primary"
            disabled={!allConfirmed}
            onClick={() => showModal("approve")}
          >
            Approve
          </Button>
        </div>
      </div>
      {modal}
    </>
  );
};
