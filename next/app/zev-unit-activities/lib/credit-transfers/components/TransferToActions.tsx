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
  const [statementSigned, setStatementSigned] = useState<boolean>(false);

  const statement = useMemo(() => {
    return `On behalf of ${props.transferToSupplierName}, I confirm that the information in this notice is accurate and complete, and that ${props.transferToSupplierName} consents to this transfer.`;
  }, [props.transferToSupplierName]);

  const handleApproveOrReject = useCallback(
    async (status: CreditTransferStatus) => {
      setError("");
      try {
        const response = await transferToSupplierActionTransfer(
          props.id,
          status,
          status === CreditTransferStatus.APPROVED_BY_TRANSFER_TO
            ? statement
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
    [props.id, statement, comment],
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
    <div className="space-y-2">
      {error && <p className="text-red-600">{error}</p>}
      <Textarea value={comment} onChange={setComment} />
      <div className="p-1 flex flex-row gap-1">
        <input
          type="checkbox"
          checked={statementSigned}
          onChange={() =>
            setStatementSigned((prev) => {
              return !prev;
            })
          }
        />
        <span className="font-semibold">{statement}</span>
      </div>
      <Button
        variant="primary"
        disabled={!statementSigned}
        onClick={() => showModal("approve")}
      >
        Approve
      </Button>
      <Button variant="danger" onClick={() => showModal("reject")}>
        Reject
      </Button>
      {modal}
    </div>
  );
};
